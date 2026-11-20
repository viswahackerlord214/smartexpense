import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getUserApiKeys, createUserApiKey, revokeUserApiKey } from '@/lib/api-keys';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const keys = await getUserApiKeys(user.id);
    return NextResponse.json({ keys });
  } catch (error: any) {
    console.error('GET /api/keys error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    let keyName = 'iPhone Shortcuts Automation';
    try {
      const body = await req.json();
      if (body?.name && typeof body.name === 'string') {
        keyName = body.name.trim();
      }
    } catch (e) {
      // Body is optional
    }

    const result = await createUserApiKey(user.id, keyName);
    return NextResponse.json({
      success: true,
      key: result,
      message: 'New API secret key generated. Store it now; it cannot be shown again.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/keys error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('id') || undefined;

    const success = await revokeUserApiKey(user.id, keyId);
    return NextResponse.json({
      success,
      message: 'API key has been revoked and can no longer import transactions.',
    });
  } catch (error: any) {
    console.error('DELETE /api/keys error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

