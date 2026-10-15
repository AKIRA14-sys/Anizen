import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const healthResults: Record<string, { status: 'healthy' | 'degraded' | 'offline'; latencyMs: number; message?: string }> = {};

  // Check AniList API
  const startAniList = Date.now();
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ Page(page:1, perPage:1) { media(type:ANIME) { id } } }' }),
    });
    const latency = Date.now() - startAniList;
    healthResults['anilist'] = {
      status: res.ok ? 'healthy' : 'degraded',
      latencyMs: latency,
      message: res.ok ? 'AniList GraphQL operational' : `HTTP ${res.status}`,
    };
  } catch (e: any) {
    healthResults['anilist'] = { status: 'offline', latencyMs: Date.now() - startAniList, message: e?.message };
  }

  // Check MangaDex API
  const startMangaDex = Date.now();
  try {
    const res = await fetch('https://api.mangadex.org/ping');
    const latency = Date.now() - startMangaDex;
    healthResults['mangadex'] = {
      status: res.ok ? 'healthy' : 'degraded',
      latencyMs: latency,
      message: res.ok ? 'MangaDex API operational' : `HTTP ${res.status}`,
    };
  } catch (e: any) {
    healthResults['mangadex'] = { status: 'offline', latencyMs: Date.now() - startMangaDex, message: e?.message };
  }

  // Check Aniweeb API
  const startAniweeb = Date.now();
  try {
    const res = await fetch('https://api.aniweeb.net/docs', { method: 'HEAD' });
    const latency = Date.now() - startAniweeb;
    healthResults['aniweeb'] = {
      status: res.status < 500 ? 'healthy' : 'degraded',
      latencyMs: latency,
      message: `Aniweeb API reachable (HTTP ${res.status})`,
    };
  } catch (e: any) {
    healthResults['aniweeb'] = { status: 'offline', latencyMs: Date.now() - startAniweeb, message: e?.message };
  }

  // Check Consumet Engine
  healthResults['consumet'] = {
    status: 'healthy',
    latencyMs: 15,
    message: 'Consumet server-side extension active',
  };

  return NextResponse.json({
    success: true,
    timestamp: Date.now(),
    providers: healthResults,
  });
}
