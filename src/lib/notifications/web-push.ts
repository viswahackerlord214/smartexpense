import webpush from 'web-push';
import { NotificationSubscriptionRecord } from '@/types';
import { getServerSupabaseAdmin } from '@/lib/supabase/server';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@spendwise.app';

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error('Failed to initialize VAPID details:', err);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  transactionId?: string;
  amount?: number;
  merchant?: string;
}

/**
 * Dispatches an actionable Web Push notification to an array of push subscriptions.
 * Automatically cleans up expired/unsubscribed endpoints (HTTP 410/404) from Supabase.
 */
export async function sendWebPushNotification(
  subscriptions: NotificationSubscriptionRecord[],
  payload: PushNotificationPayload
): Promise<{ successCount: number; failureCount: number; errors: any[] }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured. Skipping push notification dispatch.');
    return { successCount: 0, failureCount: 0, errors: ['VAPID keys missing'] };
  }

  let successCount = 0;
  let failureCount = 0;
  const errors: any[] = [];
  const expiredEndpoints: string[] = [];

  const stringifiedPayload = JSON.stringify(payload);

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, stringifiedPayload, {
        TTL: 60 * 60 * 24, // 24 hours
        urgency: 'high',
      });
      successCount++;
    } catch (err: any) {
      failureCount++;
      errors.push({
        endpoint: sub.endpoint,
        statusCode: err.statusCode,
        message: err.message,
      });

      // HTTP 410 (Gone) or 404 (Not Found) means the user unsubscribed or uninstalled the PWA
      if (err.statusCode === 410 || err.statusCode === 404) {
        expiredEndpoints.push(sub.endpoint);
      }

      console.error('Error dispatching push notification to endpoint:', sub.endpoint, err.message);
    }
  }

  // Clean up expired subscriptions from Supabase
  if (expiredEndpoints.length > 0) {
    const supabase = getServerSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('notification_subscriptions')
          .delete()
          .in('endpoint', expiredEndpoints);
        console.log(`Cleaned up ${expiredEndpoints.length} expired push subscription(s).`);
      } catch (cleanErr) {
        console.error('Failed to clean up expired subscriptions:', cleanErr);
      }
    }
  }

  return { successCount, failureCount, errors };
}
