import { NextRequest, NextResponse } from 'next/server';
import { saveNotificationSubscription } from '@/lib/data/store';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys, userAgent } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription payload: endpoint and keys are required' },
        { status: 400 }
      );
    }

    const success = await saveNotificationSubscription(
      { endpoint, keys, userAgent },
      user.id
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save subscription in database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Push notification subscription registered successfully',
    });
  } catch (error: any) {
    console.error('Subscribe API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
