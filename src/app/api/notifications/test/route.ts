import { NextRequest, NextResponse } from 'next/server';
import { getNotificationSubscriptions, createTransaction, getTransactions } from '@/lib/data/store';
import { sendWebPushNotification } from '@/lib/notifications/web-push';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const subscriptions = await getNotificationSubscriptions(user.id);

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No active push notification subscriptions found on your account. Please enable push notifications on your iPhone PWA first.',
        },
        { status: 404 }
      );
    }

    // Find an existing pending transaction or create a real test pending transaction in Supabase
    let targetTxnId: string;
    const existingTxns = await getTransactions(user.id);
    const existingPending = existingTxns.find((t) => t.status === 'pending_categorization');

    if (existingPending) {
      targetTxnId = existingPending.id;
    } else {
      const sample = await createTransaction(
        {
          user_id: user.id,
          amount: 850,
          currency: 'INR',
          transaction_type: 'debit',
          merchant: 'Swiggy',
          bank_sender: 'HDFCBK',
          transaction_date: new Date().toISOString(),
          status: 'pending_categorization',
          raw_message_hash: `test-${Date.now()}`,
          confidence_score: 1.0,
          notes: 'Test Notification Transaction • Tap to categorize',
        },
        user.id
      );
      targetTxnId = sample.id;
    }

    const result = await sendWebPushNotification(subscriptions, {
      title: 'SpendWise • ₹850.00 spent!',
      body: 'Bank: HDFC Bank • Merchant: Swiggy\nWhere did you spend this money? Tap to categorize.',
      url: `/?categorize=${targetTxnId}`,
      transactionId: targetTxnId,
      amount: 850,
      merchant: 'Swiggy',
    });

    return NextResponse.json({
      success: result.successCount > 0,
      deliveredToCount: result.successCount,
      transactionId: targetTxnId,
      result,
      message:
        result.successCount > 0
          ? `Push notification successfully delivered to ${result.successCount} registered iPhone device(s).`
          : 'Failed to deliver push notification. Push service returned errors.',
    });
  } catch (error: any) {
    console.error('Notification test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
