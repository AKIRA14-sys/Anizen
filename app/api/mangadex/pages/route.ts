import { NextRequest, NextResponse } from 'next/server';
import { getMangaDexChapterPages } from '@/lib/mangadex';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chapterId = searchParams.get('chapterId');

  if (!chapterId) {
    return NextResponse.json({ success: false, message: 'Chapter ID required' }, { status: 400 });
  }

  try {
    const pages = await getMangaDexChapterPages(chapterId);
    if (!pages) {
      return NextResponse.json({ success: false, message: 'Failed to retrieve chapter pages' }, { status: 404 });
    }

    return NextResponse.json({ success: true, pages });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Error loading chapter pages' },
      { status: 500 }
    );
  }
}
