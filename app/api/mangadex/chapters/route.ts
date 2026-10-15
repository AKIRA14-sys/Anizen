import { NextRequest, NextResponse } from 'next/server';
import { findMangaDexIdByTitle, getMangaDexChapters } from '@/lib/mangadex';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const mangadexIdParam = searchParams.get('mangadexId');

  try {
    let mangadexId = mangadexIdParam;
    if (!mangadexId && title) {
      mangadexId = await findMangaDexIdByTitle(title);
    }

    if (!mangadexId) {
      return NextResponse.json({ success: false, message: 'MangaDex title not found', chapters: [] });
    }

    const chapters = await getMangaDexChapters(mangadexId);
    return NextResponse.json({ success: true, mangadexId, chapters });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}
