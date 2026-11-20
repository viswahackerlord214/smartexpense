import { NextRequest, NextResponse } from 'next/server';
import { getTransactions, createTransaction } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const transactions = await getTransactions();
    return NextResponse.json({ transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newTxn = await createTransaction(body);
    return NextResponse.json({ transaction: newTxn }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

