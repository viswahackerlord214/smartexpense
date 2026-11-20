import { NextRequest, NextResponse } from 'next/server';
import { getBudgets, saveBudget } from '@/lib/data/store';

export async function GET() {
  try {
    const budgets = await getBudgets();
    return NextResponse.json({ budgets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const saved = await saveBudget({
      user_id: 'usr-demo',
      category_id: body.category_id || null,
      period: body.period || 'monthly',
      amount_limit: parseFloat(body.amount_limit),
      threshold_warning: body.threshold_warning || 75,
      threshold_critical: body.threshold_critical || 90,
    });
    return NextResponse.json({ budget: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

