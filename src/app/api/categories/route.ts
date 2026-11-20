import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory } from '@/lib/data/store';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const categories = await getCategories(user?.id);
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('GET /api/categories error:', error);
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
    const newCategory = await createCategory(
      {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        icon: body.icon || 'Tag',
        color: body.color || '#10B981',
        type: body.type || 'expense',
      },
      user.id
    );
    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
