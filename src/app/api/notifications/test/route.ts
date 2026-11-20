import { NextRequest, NextResponse } from 'next/server';
import { getNotificationSubscriptions, getTransactions } from '@/lib/data/store';
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
            'No active push notification subscriptions found on your account. Please enable push notifications on your iPhone PWA in Settings first.',
        },
        { status: 404 }
      );
    }

    // Check if user has an existing transaction to link to
    const existingTxns = await getTransactions(user.id);
    const existingPending = existingTxns.find((t) => t.status === 'pending_categorization') || existingTxns[0];

    const targetUrl = existingPending ? `/?categorize=${existingPending.id}` : '/';

    const result = await sendWebPushNotification(subscriptions, {
      title: 'SpendWise • Push Notification Active!',
      body: existingPending
        ? `Bank: ${existingPending.bank_sender} • Merchant: ${existingPending.merchant}\nTap to categorize this transaction.`
        : 'Your iPhone push notifications are operational. Bank SMS arrivals will alert you here in real-time.',
      url: targetUrl,
      transactionId: existingPending?.id,
      amount: existingPending?.amount,
      merchant: existingPending?.merchant,
    });

    return NextResponse.json({
      success: result.successCount > 0,
      deliveredToCount: result.successCount,
      transactionId: existingPending?.id,
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
