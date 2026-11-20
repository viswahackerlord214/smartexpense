import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBankSMS } from '@/lib/parser/bank-parser';
import {
  createTransaction,
  findDuplicateTransaction,
  getNotificationSubscriptions,
} from '@/lib/data/store';
import { sendWebPushNotification } from '@/lib/notifications/web-push';

export const dynamic = 'force-dynamic';

const importSchema = z.object({
  message: z.string().min(5, 'SMS message content is required'),
  sender: z.string().optional().default('UNKNOWN'),
  timestamp: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. API KEY AUTHENTICATION
    const authHeader = req.headers.get('authorization') || '';
    const apiKeyHeader = req.headers.get('x-api-key') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || apiKeyHeader;
    const configuredSecret = process.env.SPENDWISE_API_SECRET || 'sw_live_sec_8f9a2b4e7c1d3a5f6e8b0c2d4e6f8a0b';

    // Allow default secret or any demo test token
    if (token && token !== configuredSecret && !token.startsWith('sw_')) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API key. Please check your SpendWise Shortcuts configuration.' },
        { status: 401 }
      );
    }

    // 2. PAYLOAD VALIDATION
    const body = await req.json();
    const parsedInput = importSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsedInput.error.format() },
        { status: 400 }
      );
    }

    const { message, sender, timestamp } = parsedInput.data;

    // 3. PARSE BANK SMS
    const parsed = parseBankSMS(message, sender);

    // 4. HANDLE NON-TRANSACTION MESSAGES (OTP, PROMO, BALANCE-ONLY)
    if (parsed.is_non_transaction) {
      return NextResponse.json({
        success: false,
        is_non_transaction: true,
        reason: parsed.non_transaction_reason,
        explanation: parsed.explanation,
        message: 'Message filtered out. Non-expense notification safely discarded.',
      });
    }

    // Must have a valid amount
    if (!parsed.amount || parsed.amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid monetary amount detected in SMS.',
        details: parsed,
      }, { status: 422 });
    }

    // 5. DUPLICATE DETECTION CHECK
    const existing = await findDuplicateTransaction(parsed.raw_hash);
    if (existing) {
      return NextResponse.json({
        success: true,
        is_duplicate: true,
        message: 'Duplicate transaction detected. Transaction was already recorded.',
        transaction: existing,
      });
    }

    // 6. SAVE TRANSACTION TO DATABASE
    const txnDate = timestamp ? new Date(timestamp).toISOString() : parsed.transaction_date;

    const newTransaction = await createTransaction({
      user_id: 'usr-demo',
      amount: parsed.amount,
      currency: parsed.currency,
      transaction_type: parsed.transaction_type,
      merchant: parsed.merchant || 'Unknown Merchant',
      bank_sender: parsed.bank_sender,
      transaction_reference: parsed.transaction_reference || undefined,
      card_last4: parsed.card_last4 || undefined,
      upi_ref: parsed.upi_ref || undefined,
      account_type: parsed.account_last4 ? 'savings' : 'credit_card',
      transaction_date: txnDate,
      category_id: null, // Pending user 1-tap categorization
      status: parsed.is_ambiguous ? 'flagged_review' : 'pending_categorization',
      raw_message_hash: parsed.raw_hash,
      confidence_score: parsed.confidence_score,
      notes: `Imported via Apple Shortcuts. ${parsed.explanation}`,
    });

    // 7. SEND ACTIONABLE IPHONE WEB PUSH NOTIFICATION
    const subscriptions = await getNotificationSubscriptions();
    let pushResult = { successCount: 0, failureCount: 0, errors: [] as any[] };

    if (subscriptions.length > 0) {
      const formattedAmount = `₹${parsed.amount.toLocaleString('en-IN')}`;
      const title = `SpendWise • ${formattedAmount} spent!`;
      const bodyText = `Bank: ${parsed.bank_sender} • Merchant: ${parsed.merchant || 'Unknown'}\nWhere did you spend this money? Tap to categorize.`;

      pushResult = await sendWebPushNotification(subscriptions, {
        title,
        body: bodyText,
        url: `/?categorize=${newTransaction.id}`,
        transactionId: newTransaction.id,
        amount: parsed.amount,
        merchant: parsed.merchant || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      transaction: newTransaction,
      parsed_details: parsed,
      notifications_dispatched: pushResult.successCount,
      notification_status: subscriptions.length > 0 ? 'sent' : 'no_active_subscriptions',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Import transaction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing transaction import', message: error.message },
      { status: 500 }
    );
  }
}

