import type { ParsedTransactionResult, TransactionType } from '@/types';
import crypto from 'crypto';

export interface BankRule {
  id: string;
  name: string;
  senderPatterns: RegExp[];
  amountRegex: RegExp[];
  typePatterns: {
    debit?: RegExp[];
    credit?: RegExp[];
    refund?: RegExp[];
    reversal?: RegExp[];
    failed?: RegExp[];
  };
  merchantRegex: RegExp[];
  referenceRegex: RegExp[];
  cardRegex: RegExp[];
  accountRegex: RegExp[];
}

export const KNOWN_BANKS: Record<string, string> = {
  HDFCBK: 'HDFC Bank',
  HDFC: 'HDFC Bank',
  SBIINB: 'State Bank of India',
  SBIPSG: 'State Bank of India',
  SBI: 'State Bank of India',
  ICICIB: 'ICICI Bank',
  ICICI: 'ICICI Bank',
  FEDX: 'Federal Bank',
  FEDBNK: 'Federal Bank',
  AXISBK: 'Axis Bank',
  AXIS: 'Axis Bank',
  KOTAKB: 'Kotak Mahindra Bank',
  KOTAK: 'Kotak Mahindra Bank',
  INDUSB: 'IndusInd Bank',
  YESBNK: 'Yes Bank',
  PNBSMS: 'Punjab National Bank',
  CANBNK: 'Canara Bank',
};

// Common OTP & Non-transaction patterns to strictly filter out
const OTP_PATTERNS = [
  /\bOTP\b/i,
  /\bone[- ]time password\b/i,
  /\bverification code\b/i,
  /\bsecurity code\b/i,
  /\bdo not share\b/i,
  /\bnever share your otp\b/i,
  /\bsecret code\b/i,
];

const PROMO_PATTERNS = [
  /\bpre[- ]approved\b/i,
  /\bcongratulations\b/i,
  /\binstant personal loan\b/i,
  /\bcredit limit increase\b/i,
  /\bapply now\b/i,
  /\blimited period offer\b/i,
  /\bzero interest\b/i,
  /\bclaim your\b/i,
];

const BALANCE_ONLY_PATTERNS = [
  /^(clear\s+)?(avail(able)?\s+)?bal(ance)?(\s+in\s+a\/c)?\s*(is\s*)?(:|\s)/i,
  /your\s+(a\/c|account)\s+balance\s+is\s+rs/i,
  /inq(uiry)?\s+for\s+bal(ance)?/i,
];

/**
 * Calculates a unique idempotency hash for transaction duplicate detection.
 */
export function calculateTransactionHash(
  bankSender: string,
  amount: number,
  merchant: string | null,
  reference: string | null,
  rawText: string
): string {
  // Normalize raw string to eliminate random whitespace / casing differences
  const normalizedRaw = rawText.trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedRef = (reference || '').trim().toLowerCase();
  
  // If a reliable bank reference exists, use that + amount + bank
  if (normalizedRef && normalizedRef.length >= 6) {
    return crypto
      .createHash('sha256')
      .update(`${bankSender.toUpperCase()}_${amount}_${normalizedRef}`)
      .digest('hex');
  }

  // Fallback to normalized content hash
  return crypto
    .createHash('sha256')
    .update(`${bankSender.toUpperCase()}_${amount}_${merchant || ''}_${normalizedRaw}`)
    .digest('hex');
}

/**
 * Clean & normalize merchant strings into user-friendly names
 * (e.g. "VPA Swiggy@icici" -> "Swiggy", "AMZN Mktp" -> "Amazon")
 */
export function normalizeMerchant(rawMerchant: string | null): string {
  if (!rawMerchant) return 'Unknown Merchant';

  let cleaned = rawMerchant
    .replace(/^VPA\s+/i, '')
    .replace(/^Info:\s*/i, '')
    .replace(/^to\s+/i, '')
    .replace(/^at\s+/i, '')
    .replace(/@\w+$/i, '') // Remove UPI handles like @icici, @okaxis
    .replace(/\*+/g, ' ')
    .replace(/BANGALORE|MUMBAI|DELHI|HYDERABAD|CHENNAI|PUNE|GURGAON|NOIDA/gi, '')
    .trim();

  // Common brand mappings
  const brandMappings: Record<string, string> = {
    swiggy: 'Swiggy',
    zomato: 'Zomato',
    amzn: 'Amazon',
    amazon: 'Amazon',
    uber: 'Uber',
    ola: 'Ola Cabs',
    flipkart: 'Flipkart',
    starbucks: 'Starbucks',
    dmart: 'DMart',
    blinkit: 'Blinkit',
    zepto: 'Zepto',
    instamart: 'Swiggy Instamart',
    netflix: 'Netflix',
    spotify: 'Spotify',
    airtel: 'Airtel',
    jio: 'Reliance Jio',
    bescom: 'BESCOM Electricity',
    shell: 'Shell Petrol',
    bpcl: 'Bharat Petroleum',
    hpcl: 'HPCL Fuel',
    ioc: 'Indian Oil',
    pvr: 'PVR Cinemas',
    inox: 'INOX Movies',
    apollo: 'Apollo Pharmacy',
    cultfit: 'Cult.fit',
    myntra: 'Myntra',
    makemytrip: 'MakeMyTrip',
    irctc: 'IRCTC Railways',
  };

  const lower = cleaned.toLowerCase();
  for (const [key, normalized] of Object.entries(brandMappings)) {
    if (lower.includes(key)) {
      return normalized;
    }
  }

  // Clean trailing punctuation or weird codes
  cleaned = cleaned.replace(/[-,._/]+$/, '').trim();
  if (cleaned.length > 32) {
    cleaned = cleaned.substring(0, 32).trim() + '...';
  }

  return cleaned || 'Unknown Merchant';
}

/**
 * Main SMS Parser Function
 */
export function parseBankSMS(messageText: string, rawSender?: string): ParsedTransactionResult {
  const text = messageText.trim();
  const normalizedSender = (rawSender || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // 1. Identify Bank Sender
  let bankSender = 'UNKNOWN_BANK';
  for (const [code, fullName] of Object.entries(KNOWN_BANKS)) {
    if (normalizedSender.includes(code) || text.toUpperCase().includes(code)) {
      bankSender = code;
      break;
    }
  }

  // Default fallback if sender has recognizable bank tag
  if (bankSender === 'UNKNOWN_BANK' && normalizedSender) {
    bankSender = normalizedSender.slice(-6); // e.g. "VK-HDFCBK" -> "HDFCBK"
  }

  // 2. CHECK NON-TRANSACTION FILTERS
  // A. OTP Check
  const hasOtp = OTP_PATTERNS.some((pattern) => pattern.test(text));
  if (hasOtp) {
    return {
      amount: null,
      currency: 'INR',
      transaction_type: 'failed',
      merchant: null,
      bank_sender: bankSender,
      transaction_reference: null,
      transaction_date: new Date().toISOString(),
      card_last4: null,
      upi_ref: null,
      account_last4: null,
      confidence_score: 0,
      is_ambiguous: false,
      is_non_transaction: true,
      non_transaction_reason: 'otp',
      raw_hash: '',
      explanation: 'Filtered: One-Time Password (OTP) or authentication security code.',
    };
  }

  // B. Promotional Check
  const hasPromo = PROMO_PATTERNS.some((pattern) => pattern.test(text));
  if (hasPromo && !/debited|credited/i.test(text)) {
    return {
      amount: null,
      currency: 'INR',
      transaction_type: 'failed',
      merchant: null,
      bank_sender: bankSender,
      transaction_reference: null,
      transaction_date: new Date().toISOString(),
      card_last4: null,
      upi_ref: null,
      account_last4: null,
      confidence_score: 0,
      is_ambiguous: false,
      is_non_transaction: true,
      non_transaction_reason: 'promotional',
      raw_hash: '',
      explanation: 'Filtered: Promotional or marketing broadcast.',
    };
  }

  // C. Balance Only Check
  const isBalanceOnly = BALANCE_ONLY_PATTERNS.some((pattern) => pattern.test(text));
  if (isBalanceOnly && !/(debited|credited|spent|charged|withdrawn|refund)/i.test(text)) {
    return {
      amount: null,
      currency: 'INR',
      transaction_type: 'balance_query',
      merchant: null,
      bank_sender: bankSender,
      transaction_reference: null,
      transaction_date: new Date().toISOString(),
      card_last4: null,
      upi_ref: null,
      account_last4: null,
      confidence_score: 0,
      is_ambiguous: false,
      is_non_transaction: true,
      non_transaction_reason: 'balance_only',
      raw_hash: '',
      explanation: 'Filtered: Balance query or non-spending account balance notice.',
    };
  }

  // 3. EXTRACT AMOUNT
  // Patterns like "Rs. 850.00", "Rs 850", "INR 850.50", "debited by 850"
  let amount: number | null = null;
  const amountPatterns = [
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:debited|credited|spent|charged|transferred|withdrawn)\s*(?:by|for|of)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i,
  ];

  for (const regex of amountPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleanedAmount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(cleanedAmount) && cleanedAmount > 0) {
        amount = cleanedAmount;
        break;
      }
    }
  }

  // 4. TRANSACTION TYPE (debit, credit, refund, reversal, failed)
  let transactionType: TransactionType = 'debit';
  if (/refund|refunded/i.test(text)) {
    transactionType = 'refund';
  } else if (/reversal|reversed/i.test(text)) {
    transactionType = 'reversal';
  } else if (/declined|failed|unsuccessful|rejected/i.test(text)) {
    transactionType = 'failed';
  } else if (/credited|deposited|received/i.test(text)) {
    transactionType = 'credit';
  } else if (/debited|spent|charged|withdrawn|paid/i.test(text)) {
    transactionType = 'debit';
  }

  // 5. EXTRACT REFERENCE NUMBERS (UPI ref, IMPS ref, RRN, TXN ID)
  let transactionReference: string | null = null;
  let upiRef: string | null = null;

  const upiMatch = text.match(/(?:upi\s*(?:ref|rrn|no|id)?[:\s/]*|ref\s*no\.?[:\s]*)(\d{8,16})/i);
  if (upiMatch && upiMatch[1]) {
    upiRef = upiMatch[1];
    transactionReference = `UPI/${upiRef}`;
  } else {
    const refMatch = text.match(/(?:ref\s*(?:no|id)?\.?|rrn|txn\s*(?:id|ref)?\.?)[:\s]*([a-zA-Z0-9]{6,20})/i);
    if (refMatch && refMatch[1]) {
      transactionReference = refMatch[1];
    }
  }

  // 6. EXTRACT CARD OR ACCOUNT LAST 4 DIGITS
  let cardLast4: string | null = null;
  let accountLast4: string | null = null;

  const cardMatch = text.match(/(?:card\s*(?:ending|no\.?|xx|\*+)?\s*)(?:xx|\*+)?(\d{4})/i);
  if (cardMatch && cardMatch[1]) {
    cardLast4 = cardMatch[1];
  }

  const acctMatch = text.match(/(?:a\/c|acct|account)\s*(?:ending|no\.?|xx|\*+)?\s*(?:xx|\*+)?(\d{3,6})/i);
  if (acctMatch && acctMatch[1]) {
    accountLast4 = acctMatch[1];
  }

  // 7. EXTRACT MERCHANT
  let rawMerchant: string | null = null;
  const merchantPatterns = [
    /by\s+([a-zA-Z0-9_.\s*&-]{3,30}?)(?:\s+on|\s+ref|\s+dated|\s+bal|\.|\s*$)/i,
    /from\s+([a-zA-Z0-9_.\s*&-]{3,30}?)(?:\s+on|\s+ref|\s+dated|\s+bal|\.|\s*$)/i,
    /for\s+([a-zA-Z0-9_.\s*&-]{3,30}?)(?:\s+on|\s+ref|\s+dated|\s+bal|\.|\s*$)/i,
    /(?:at|towards|vpa|info:)\s+([a-zA-Z0-9_.\s*&-]{3,30}?)(?:\s+on|\s+ref|\s+dated|\s+bal|\.|\s*$)/i,
    /to\s+([a-zA-Z0-9_.\s*&-]{3,30}?)(?:\s+on|\s+ref|\s+dated|\s+bal|\.|\s*$)/i,
    /vpa\s+([a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+)/i,
    /(?:paid to|transferred to|towards)\s+([a-zA-Z0-9_.\s*&-]{3,30})/i,
    /(?:purchase at|spent on)\s+([a-zA-Z0-9_.\s*&-]{3,30})/i,
  ];

  for (const regex of merchantPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Filter out bank names, pronouns, currency tokens, dates, and account references
      if (!/^(the|your|a\/c|account|rs\.?|inr|\d+|hdfc|sbi|icici|axis|fedbank|kotak|bank|on\s+\d)/i.test(candidate)) {
        rawMerchant = candidate;
        break;
      }
    }
  }

  const merchant = normalizeMerchant(rawMerchant);

  // 8. EXTRACT TRANSACTION DATE (OR USE CURRENT)
  let transactionDate = new Date().toISOString();
  const dateMatch = text.match(/(\d{1,2}[-/][a-zA-Z0-9]{3,}[-/]\d{2,4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
  if (dateMatch && dateMatch[1]) {
    const parsedDate = new Date(dateMatch[1]);
    if (!isNaN(parsedDate.getTime())) {
      transactionDate = parsedDate.toISOString();
    }
  }

  // 9. CONFIDENCE SCORING
  let confidence = 0.0;
  if (amount !== null && amount > 0) confidence += 0.40;
  if (bankSender !== 'UNKNOWN_BANK') confidence += 0.20;
  if (merchant && merchant !== 'Unknown Merchant') confidence += 0.20;
  if (transactionReference || upiRef || cardLast4 || accountLast4) confidence += 0.15;
  if (transactionType) confidence += 0.05;

  confidence = Math.min(1.0, Math.round(confidence * 100) / 100);
  const isAmbiguous = confidence < 0.65 || amount === null;

  // 10. GENERATE DUPLICATE DETECTION HASH
  const rawHash = calculateTransactionHash(
    bankSender,
    amount || 0,
    merchant,
    transactionReference,
    text
  );

  return {
    amount,
    currency: 'INR',
    transaction_type: transactionType,
    merchant,
    bank_sender: bankSender,
    transaction_reference: transactionReference,
    transaction_date: transactionDate,
    card_last4: cardLast4,
    upi_ref: upiRef,
    account_last4: accountLast4,
    confidence_score: confidence,
    is_ambiguous: isAmbiguous,
    is_non_transaction: false,
    raw_hash: rawHash,
    explanation: isAmbiguous
      ? 'Amount or merchant could not be definitively extracted with high confidence.'
      : `Successfully parsed ${transactionType.toUpperCase()} of ₹${amount} from ${bankSender}.`,
  };
}

/**
 * Sample real-world bank SMS test cases for the Testing Bench
 */
export const SAMPLE_BANK_MESSAGES = [
  {
    bank: 'HDFC Bank',
    sender: 'HDFCBK',
    message: 'Sent Rs. 850.00 from HDFC Bank A/C **4821 to VPA swiggy@icici on 20-11-26. UPI Ref 4325987112. Avl Bal Rs. 34,210.50.',
    expectedType: 'debit',
  },
  {
    bank: 'ICICI Bank',
    sender: 'ICICIB',
    message: 'Your ICICI Bank Credit Card XX4129 has been used for INR 2,499.00 at AMAZON INDIA on 19-Nov-26 18:30:12. Ref no: TXN882910398. Avail limit: INR 1,45,000.',
    expectedType: 'debit',
  },
  {
    bank: 'Federal Bank',
    sender: 'FEDX',
    message: 'Rs 420.00 debited from your FedBank a/c 10928374 for STARBUCKS COFFEE on 16-11-26 via UPI Ref 4321908812. Total Bal: Rs 18,430.',
    expectedType: 'debit',
  },
  {
    bank: 'State Bank of India',
    sender: 'SBIINB',
    message: 'Your A/C ending 8834 debited by Rs.1450.00 on 18-Nov-26 at SHELL PETROL PUMP BANGALORE. UPI Ref 9921008234. -SBI',
    expectedType: 'debit',
  },
  {
    bank: 'Axis Bank',
    sender: 'AXISBK',
    message: 'INR 1,200.00 debited from A/C no. XX3948 on 08-11-2026 18:15:10 towards APOLLO PHARMACY. UPI: 4318765432. Avail Bal: INR 42,100.',
    expectedType: 'debit',
  },
  {
    bank: 'Refund Sample',
    sender: 'HDFCBK',
    message: 'Refund of Rs. 650.00 credited to your HDFC Bank A/C XX4821 by ZOMATO on 10-11-26. Ref no: REF/4319882910. Bal: Rs. 35,060.',
    expectedType: 'refund',
  },
  {
    bank: 'OTP (Should be Filtered)',
    sender: 'HDFCBK',
    message: '492810 is your OTP for transaction of INR 3,500.00 on your HDFC Bank Credit Card. OTP is valid for 10 mins. Do not share with anyone.',
    expectedType: 'failed',
  },
  {
    bank: 'Promotional (Should be Filtered)',
    sender: 'ICICIB',
    message: 'Congratulations! You are pre-approved for an instant personal loan of up to Rs 5,00,000 at zero processing fee. Apply today.',
    expectedType: 'failed',
  },
  {
    bank: 'Balance Only (Should be Filtered)',
    sender: 'SBIINB',
    message: 'Available balance in your State Bank of India A/C ending 8834 is Rs. 45,920.80 as of 20-Nov-2026. -SBI',
    expectedType: 'balance_query',
  },
];

