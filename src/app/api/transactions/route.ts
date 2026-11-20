import { NextRequest, NextResponse } from 'next/server';
import { getTransactions, createTransaction } from '@/lib/data/store';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const transactions = await getTransactions(user.id);
    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const body = await req.json();
    const newTxn = await createTransaction(body, user.id);
    return NextResponse.json({ transaction: newTxn }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
