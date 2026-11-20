import { NextRequest, NextResponse } from 'next/server';
import { getBudgets, saveBudget } from '@/lib/data/store';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const budgets = await getBudgets(user.id);
    return NextResponse.json({ budgets });
  } catch (error: any) {
    console.error('GET /api/budgets error:', error);
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
    const saved = await saveBudget(
      {
        category_id: body.category_id || null,
        period: body.period || 'monthly',
        amount_limit: parseFloat(body.amount_limit),
        threshold_warning: body.threshold_warning || 75,
        threshold_critical: body.threshold_critical || 90,
      },
      user.id
    );
    return NextResponse.json({ budget: saved });
  } catch (error: any) {
    console.error('POST /api/budgets error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
