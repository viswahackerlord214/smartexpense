import { NextRequest, NextResponse } from 'next/server';
import { saveNotificationSubscription, getNotificationSubscriptions } from '@/lib/data/store';

export async function GET() {
  const subs = await getNotificationSubscriptions();
  return NextResponse.json({ subscriptionsCount: subs.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys, userAgent } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription object. Missing endpoint or keys.' },
        { status: 400 }
      );
    }

    const saved = await saveNotificationSubscription({
      user_id: 'usr-demo',
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: userAgent || 'Browser/iOS PWA',
    });

    return NextResponse.json({
      success: true,
      message: 'Push notification subscription registered successfully',
      subscription: saved,
    });
  } catch (error: any) {
    console.error('Subscribe API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

