import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { deleteTransaction, getTransactionById } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const transaction = await getTransactionById(params.id, user.id);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error: any) {
    console.error('GET /api/transactions/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    await deleteTransaction(params.id, user.id);
    return NextResponse.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/transactions/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

