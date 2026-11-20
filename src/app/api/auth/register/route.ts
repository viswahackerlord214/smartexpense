import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password, fullName } = parsed.data;

    const supabaseAdmin = getServerSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server database configuration missing' },
        { status: 500 }
      );
    }

    // Create user via Supabase Admin API with email pre-confirmed
    // This avoids hitting the Supabase free tier 3-emails/hour SMTP rate limit
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please sign in instead.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: fullName.trim(),
      },
      message: 'Account created and verified successfully.',
    }, { status: 201 });
  } catch (err: any) {
    console.error('Registration API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error creating account' },
      { status: 500 }
    );
  }
}
