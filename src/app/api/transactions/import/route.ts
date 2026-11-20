import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBankSMS } from '@/lib/parser/bank-parser';
import {
  createTransaction,
  findDuplicateTransaction,
  getNotificationSubscriptions,
} from '@/lib/data/store';
import { sendWebPushNotification } from '@/lib/notifications/web-push';
import { validateApiKey } from '@/lib/api-keys';

export const dynamic = 'force-dynamic';

const importSchema = z.object({
  message: z.string().min(5, 'SMS message content is required'),
  sender: z.string().optional().default('UNKNOWN'),
  timestamp: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. EXTRACT INDIVIDUAL API KEY FROM AUTHORIZATION OR X-API-KEY HEADER
    const authHeader = req.headers.get('authorization') || '';
    const apiKeyHeader = req.headers.get('x-api-key') || '';
    const rawKey = authHeader.replace(/^Bearer\s+/i, '') || apiKeyHeader;

    if (!rawKey) {
      return NextResponse.json(
        {
          error: 'Unauthorized: Missing API Key',
          message:
            'Please include your personal iPhone Shortcuts API key in the Authorization header as: Bearer sw_live_...',
        },
        { status: 401 }
      );
    }

    // 2. CRYPTOGRAPHICALLY VALIDATE INDIVIDUAL USER API KEY
    const validation = await validateApiKey(rawKey);
    if (!validation.valid || !validation.userId) {
      return NextResponse.json(
        {
          error: 'Unauthorized: Invalid or revoked API key',
          message:
            validation.error ||
            'The provided API key is invalid or has been revoked. Generate a new key in SpendWise Settings.',
        },
        { status: 401 }
      );
    }

    const userId = validation.userId;

    // 3. VALIDATE REQUEST PAYLOAD
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON payload. Ensure Request Body is set to JSON in Apple Shortcuts.' },
        { status: 400 }
      );
    }

    const parsedInput = importSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        { error: 'Invalid payload structure', details: parsedInput.error.format() },
        { status: 400 }
      );
    }

    const { message, sender, timestamp } = parsedInput.data;

    // 4. PARSE BANK SMS
    const parsed = parseBankSMS(message, sender);

    // 5. HANDLE NON-TRANSACTION MESSAGES (OTP, PROMOTIONS, BALANCE INQUIRIES)
    if (parsed.is_non_transaction) {
      return NextResponse.json({
        success: false,
        is_non_transaction: true,
        reason: parsed.non_transaction_reason,
        explanation: parsed.explanation,
        message: 'Non-expense message safely discarded (no OTPs or promos saved).',
      });
    }

    // Must have a valid monetary amount
    if (!parsed.amount || parsed.amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid monetary amount detected in SMS.',
          details: parsed,
        },
        { status: 422 }
      );
    }

    // 6. PREVENT DUPLICATE TRANSACTIONS (SCOPED TO THIS SPECIFIC USER)
    const existing = await findDuplicateTransaction(parsed.raw_hash, userId);
    if (existing) {
      return NextResponse.json({
        success: true,
        is_duplicate: true,
        message: 'Duplicate transaction detected. Transaction was already recorded for your account.',
        transaction: existing,
      });
    }

    // 7. SAVE TRANSACTION TO SUPABASE ASSOCIATED WITH THIS USER
    const txnDate = timestamp ? new Date(timestamp).toISOString() : parsed.transaction_date;

    const newTransaction = await createTransaction(
      {
        user_id: userId,
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
        category_id: null, // Pending 1-tap categorization
        status: parsed.is_ambiguous ? 'flagged_review' : 'pending_categorization',
        raw_message_hash: parsed.raw_hash,
        confidence_score: parsed.confidence_score,
        notes: `Imported via Apple Shortcuts. ${parsed.explanation}`,
      },
      userId
    );

    // 8. DISPATCH ACTIONABLE IPHONE WEB PUSH NOTIFICATION TO THIS USER
    const subscriptions = await getNotificationSubscriptions(userId);
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

    return NextResponse.json(
      {
        success: true,
        transaction: newTransaction,
        parsed_details: parsed,
        notifications_dispatched: pushResult.successCount,
        notification_status: subscriptions.length > 0 ? 'sent' : 'no_active_subscriptions',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Import transaction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing transaction import', message: error.message },
      { status: 500 }
    );
  }
}
