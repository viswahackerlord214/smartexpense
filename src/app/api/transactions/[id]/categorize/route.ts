import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateTransactionCategory, getTransactionById } from '@/lib/data/store';

const categorizeSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const parsed = categorizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const transaction = await getTransactionById(id);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const updated = await updateTransactionCategory(id, parsed.data.categoryId);

    return NextResponse.json({
      success: true,
      transaction: updated,
      message: 'Transaction categorized successfully',
    });
  } catch (error: any) {
    console.error('Categorize API error:', error);
    return NextResponse.json(
      { error: 'Failed to categorize transaction', message: error.message },
      { status: 500 }
    );
  }
}

