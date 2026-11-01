// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

async function directFetch(url: string) {
  try {
    console.log(`[DirectFetch] ${url}`);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 EvaBot' },
      signal: AbortSignal.timeout(3000), // 3 sec not 8 sec = faster
    });
    if (!res.ok) return `Failed ${res.status} for ${url}`;
    const html = await res.text();
    const clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').substring(0, 10000);
    return `LIVE FROM OFFICIAL SITE ${url}:\n${clean}`;
  } catch (e: any) {
    return `Direct fetch failed ${url}: ${e.message}`;
  }
}

async function tavilySearch(query: string) {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: 'basic', // basic = faster than advanced
        include_answer: true,
        max_results: 3, // 3 not 5 = faster
      }),
    });
    const data = await res.json();
    return JSON.stringify(data);
  } catch (e: any) {
    return `Tavily failed: ${e.message}`;
  }
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const lastMsg = messages[messages.length-1]?.content?.toLowerCase() || '';

  // SMART CHECK: Only fetch official site when question needs live fact
  const needsLive = /followers|price|how much|live|score|now|today|current|speed|bugatti|tiktok|instagram|iphone|bitcoin|weather|goals|stats/i.test(lastMsg);

  const systemPrompt = `You are EVA, friendly Naija AI with REAL LIVE INTERNET.
You have 2 tools:
1. directFetch(url) - ALWAYS use FIRST for factual/live data. Official sources: tiktok.com/@username, bugatti.com, apple.com, coinmarketcap.com, livescore.com etc
2. tavilySearch(query) - Fallback if directFetch fails.

Rules:
- Try directFetch FIRST for followers, prices, scores, stats.
- If directFetch gives 55.1M and Tavily gives 54.5M, trust directFetch because it's LIVE.
- Only say Wow/Omo if truly shocking.
- Current date: ${new Date().toDateString()}
${!
