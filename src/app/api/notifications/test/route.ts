import { NextRequest, NextResponse } from 'next/server';
import { getNotificationSubscriptions } from '@/lib/data/store';
import { sendWebPushNotification } from '@/lib/notifications/web-push';

export async function POST(req: NextRequest) {
  try {
    const subscriptions = await getNotificationSubscriptions();

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No push subscriptions found. Please enable push notifications on your device first.',
        },
        { status: 404 }
      );
    }

    const result = await sendWebPushNotification(subscriptions, {
      title: 'SpendWise • ₹850 spent!',
      body: 'Bank: HDFC Bank • Merchant: Swiggy\nTap to select category.',
      url: '/?categorize=txn-001',
      transactionId: 'txn-001',
      amount: 850,
      merchant: 'Swiggy',
    });

    return NextResponse.json({
      success: result.successCount > 0,
      result,
      message: `Test notification sent to ${result.successCount} registered device(s).`,
    });
  } catch (error: any) {
    console.error('Notification test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

