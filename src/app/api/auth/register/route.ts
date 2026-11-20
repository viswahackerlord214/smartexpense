import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseAdmin, createClient } from '@/lib/supabase/server';
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

    // Check if Supabase URL is present
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
      return NextResponse.json(
        {
          error:
            'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) are missing in Vercel Settings → Environment Variables.',
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = getServerSupabaseAdmin();

    // 1. If admin client is available, create user with pre-confirmed email (bypasses SMTP rate limits)
    if (supabaseAdmin && process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
            { error: 'An account with this email already exists. Please sign in instead.' },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(
        {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: fullName.trim(),
          },
          message: 'Account created successfully.',
        },
        { status: 201 }
      );
    }

    // 2. Fallback: Standard client sign up if Service Role Key is not yet configured in Vercel
    const client = createClient();
    if (!client) {
      return NextResponse.json(
        {
          error:
            'Please add SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in Vercel Settings → Environment Variables.',
        },
        { status: 500 }
      );
    }

    const { data: clientData, error: clientError } = await client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (clientError) {
      return NextResponse.json({ error: clientError.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: clientData.user?.id,
          email: clientData.user?.email,
          name: fullName.trim(),
        },
        message: 'Account created successfully.',
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Registration API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error creating account' },
      { status: 500 }
    );
  }
}
