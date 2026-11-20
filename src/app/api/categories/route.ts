import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newCategory = await createCategory({
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      icon: body.icon || 'Tag',
      color: body.color || '#10B981',
      type: body.type || 'expense',
    });
    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

