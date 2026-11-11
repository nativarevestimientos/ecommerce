import { NextResponse } from "next/server";

type InstagramPost = {
  id: string;
  caption: string;
  mediaUrl: string;
  permalink: string;
  timestamp: string;
  mediaType: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 1800;
const FEED_CACHE_TTL_MS = 1000 * 60 * 30;
const feedCache = new Map<string, { savedAt: number; posts: InstagramPost[] }>();

function isInstagramMediaUrl(mediaUrl: string): boolean {
  if (!mediaUrl || !mediaUrl.startsWith("https://")) return false;
  try {
    const host = new URL(mediaUrl).hostname.toLowerCase();
    return (
      host.endsWith(".cdninstagram.com") ||
      host.endsWith(".fbcdn.net") ||
      host.endsWith(".instagram.com") ||
      host === "cdninstagram.com" ||
      host === "fbcdn.net" ||
      host === "instagram.com"
    );
  } catch {
    return false;
  }
}

function getHardcodedPosts(username: string): InstagramPost[] {
  const raw = (process.env.INSTAGRAM_FEED_STATIC_JSON || "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .map((p: any) => ({
            id: String(p?.id || ""),
            caption: String(p?.caption || ""),
            mediaUrl: String(p?.mediaUrl || ""),
            permalink: String(p?.permalink || ""),
            timestamp: String(p?.timestamp || ""),
            mediaType: String(p?.mediaType || "IMAGE"),
          }))
          .filter((p: InstagramPost) => Boolean(p.id) && Boolean(p.mediaUrl) && Boolean(p.permalink));
        if (cleaned.length > 0) return cleaned;
      }
    } catch {
      // ignore invalid json
    }
  }

  const profileUrl = `https://www.instagram.com/${username}/`;
  const now = new Date().toISOString();
  const make = (id: string, mediaUrl: string, caption: string): InstagramPost => ({
    id,
    caption,
    mediaUrl,
    permalink: profileUrl,
    timestamp: now,
    mediaType: "IMAGE",
  });

  return [
    make("hardcoded-1", "/images/home/hero/desktop/05.webp", "Nativa Revestimientos"),
    make("hardcoded-2", "/images/home/hero/desktop/06.webp", "Revestimientos y diseños"),
    make("hardcoded-3", "/images/home/hero/desktop/07.webp", "Inspiración para tus espacios"),
    make("hardcoded-4", "/images/home/collections/ofertas-especiales/desktop.png", "Colecciones destacadas"),
    make("hardcoded-5", "/images/home/collections/revestimientos/desktop.png", "Texturas y terminaciones"),
    make("hardcoded-6", "/images/home/collections/nuevos-ingresos/desktop.png", "Ideas y proyectos"),
  ];
}

function normalizeGraphItems(items: any[]): InstagramPost[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item: any) => {
      const mediaUrl = String(
        item?.media_type === "VIDEO" || item?.media_type === "REEL"
          ? item?.thumbnail_url || item?.media_url
          : item?.media_url || item?.thumbnail_url ||
        item?.mediaUrl ||
        item?.media_url ||
        item?.display_url ||
        item?.thumbnail_url ||
        "",
      );
      const permalink = String(
        item?.permalink ||
        item?.link ||
        item?.url ||
        "",
      );
      const mediaType = String(item?.mediaType || item?.media_type || "IMAGE").toUpperCase();
      const id = String(item?.id || "");
      if (!mediaUrl || !permalink) return null;
      return {
        id,
        caption: String(item?.caption || ""),
        mediaUrl,
        permalink,
        timestamp: String(item?.timestamp || ""),
        mediaType,
      } as InstagramPost;
    })
    .filter((item: InstagramPost | null): item is InstagramPost => Boolean(item));
}

async function getFromGraphApi(limit: number): Promise<InstagramPost[]> {
  const userId =
    process.env.INSTAGRAM_GRAPH_USER_ID ||
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ||
    "";
  const accessToken =
    process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN ||
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    "";
  if (!userId || !accessToken) return [];
  try {
    const endpoint = `https://graph.instagram.com/${encodeURIComponent(userId)}/media?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(endpoint, { next: { revalidate: 1800 } });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[instagram-feed] graph api no ok", { status: res.status, error: text.slice(0, 200) });
      return [];
    }
    const json = await res.json();
    const posts = normalizeGraphItems(Array.isArray(json?.data) ? json.data : []).slice(0, limit);
    if (posts.length > 0) {
      console.info("[instagram-feed] graph api exitoso", { posts: posts.length });
    } else {
      console.warn("[instagram-feed] graph api sin posts parseables");
    }
    return posts;
  } catch (error: any) {
    console.warn("[instagram-feed] graph api error", { error: error?.message || "graph_api_error" });
    return [];
  }
}

function toProxyMediaUrl(requestUrl: string, mediaUrl: string): string {
  if (!mediaUrl) return "";
  if (!mediaUrl.startsWith("https://") && !mediaUrl.startsWith("http://")) return mediaUrl;
  if (!isInstagramMediaUrl(mediaUrl)) return mediaUrl;
  try {
    const base = new URL(requestUrl);
    return `${base.origin}/api/instagram/media?url=${encodeURIComponent(mediaUrl)}`;
  } catch {
    return mediaUrl;
  }
}

function normalizePublicEdges(edges: any[]): InstagramPost[] {
  if (!Array.isArray(edges)) return [];
  return edges
    .map((edge: any) => {
      const node = edge?.node;
      const shortcode = node?.shortcode;
      const isReel = Boolean(node?.is_video) || node?.product_type === "clips";
      const mediaType = isReel ? "REEL" : node?.__typename === "GraphSidecar" ? "CAROUSEL_ALBUM" : "IMAGE";
      const caption = node?.edge_media_to_caption?.edges?.[0]?.node?.text || "";
      return {
        id: String(node?.id || ""),
        caption,
        mediaUrl: node?.thumbnail_src || node?.display_url || "",
        permalink: shortcode ? `https://www.instagram.com/${isReel ? "reel" : "p"}/${shortcode}/` : "",
        timestamp: node?.taken_at_timestamp
          ? new Date(Number(node.taken_at_timestamp) * 1000).toISOString()
          : "",
        mediaType,
      } as InstagramPost;
    })
    .filter((item: InstagramPost) => Boolean(item.id) && Boolean(item.mediaUrl) && Boolean(item.permalink));
}

function normalizePublicItems(raw: any): InstagramPost[] {
  const edges =
    raw?.data?.user?.edge_owner_to_timeline_media?.edges ||
    raw?.graphql?.user?.edge_owner_to_timeline_media?.edges ||
    raw?.user?.edge_owner_to_timeline_media?.edges;
  return normalizePublicEdges(Array.isArray(edges) ? edges : []);
}

function extractEdgesFromHtml(html: string): any[] {
  const patterns = [
    /"edge_owner_to_timeline_media":\s*\{[\s\S]*?"edges":\s*(\[[\s\S]*?\])\s*,\s*"page_info"/,
    /"xdt_api__v1__feed__user_timeline_graphql_connection":\s*\{[\s\S]*?"edges":\s*(\[[\s\S]*?\])\s*,\s*"page_info"/,
    /"edge_felix_video_timeline":\s*\{[\s\S]*?"edges":\s*(\[[\s\S]*?\])\s*,\s*"page_info"/,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      continue;
    }
  }
  return [];
}

function unescapeInstagramString(input: string): string {
  return input
    .replace(/\\u0026/g, "&")
    .replace(/\\u003C/g, "<")
    .replace(/\\u003E/g, ">")
    .replace(/\\\//g, "/");
}

function extractPostsFromHtmlLoose(html: string, limit: number): InstagramPost[] {
  const postRegex = /(?:\\"|")shortcode(?:\\"|")\s*:\s*(?:\\"|")([^"\\]+)(?:\\"|")/g;
  const posts: InstagramPost[] = [];
  const seen = new Set<string>();

  const extractValue = (chunk: string, key: string): string => {
    const patterns = [
      new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`),
      new RegExp(`\\\\"${key}\\\\"\\s*:\\s*\\\\"([^\\\\]+)\\\\"`),
    ];
    for (const pattern of patterns) {
      const m = chunk.match(pattern);
      if (m?.[1]) return m[1];
    }
    return "";
  };

  const extractNumber = (chunk: string, key: string): string => {
    const patterns = [
      new RegExp(`"${key}"\\s*:\\s*(\\d+)`),
      new RegExp(`\\\\"${key}\\\\"\\s*:\\s*(\\d+)`),
    ];
    for (const pattern of patterns) {
      const m = chunk.match(pattern);
      if (m?.[1]) return m[1];
    }
    return "";
  };

  let match: RegExpExecArray | null = null;
  while ((match = postRegex.exec(html)) !== null && posts.length < limit) {
    const shortcode = match[1];
    if (!shortcode || seen.has(shortcode)) continue;
    const start = Math.max(0, match.index - 1800);
    const end = Math.min(html.length, match.index + 7000);
    const chunk = html.slice(start, end);

    const id = extractValue(chunk, "id") || shortcode;
    const displayUrl = extractValue(chunk, "display_url") || extractValue(chunk, "thumbnail_src");
    const caption = extractValue(chunk, "text");
    const timestamp = extractNumber(chunk, "taken_at_timestamp");
    const isVideo =
      /"is_video":true/.test(chunk) ||
      /\\"is_video\\":true/.test(chunk) ||
      /"product_type":"clips"/.test(chunk) ||
      /\\"product_type\\":\\"clips\\"/.test(chunk);
    const mediaType = /"__typename":"GraphSidecar"/.test(chunk) || /\\"__typename\\":\\"GraphSidecar\\"/.test(chunk)
      ? "CAROUSEL_ALBUM"
      : isVideo
        ? "REEL"
        : "IMAGE";
    const mediaUrl = displayUrl ? unescapeInstagramString(displayUrl) : "";
    if (!mediaUrl) continue;

    posts.push({
      id: String(id),
      caption: caption ? unescapeInstagramString(caption) : "",
      mediaUrl,
      permalink: `https://www.instagram.com/${isVideo ? "reel" : "p"}/${shortcode}/`,
      timestamp: timestamp
        ? new Date(Number(timestamp) * 1000).toISOString()
        : "",
      mediaType,
    });
    seen.add(shortcode);
  }

  return posts;
}

async function readJsonSafely(res: Response): Promise<any | null> {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function getFromPublicProfile(limit: number, username: string): Promise<InstagramPost[]> {
  const commonHeaders = {
    Accept: "application/json,text/plain,*/*",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "X-IG-App-ID": "936619743392459",
    Referer: `https://www.instagram.com/${encodeURIComponent(username)}/`,
  };

  const apiCandidates = [
    `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    `https://www.instagram.com/${encodeURIComponent(username)}/?__a=1&__d=dis`,
  ];

  for (const url of apiCandidates) {
    try {
      console.info("[instagram-feed] intentando candidato", { username, url, limit });
      const res = await fetch(url, {
        headers: commonHeaders,
        next: { revalidate: 1800 },
      });
      if (!res.ok) {
        console.warn("[instagram-feed] candidato no ok", { username, url, status: res.status });
        continue;
      }
      const json = await readJsonSafely(res);
      if (!json) {
        console.warn("[instagram-feed] candidato con respuesta no JSON", { username, url });
        continue;
      }
      if (json?.status === "fail" || json?.message === "useragent mismatch") {
        console.warn("[instagram-feed] candidato bloqueado por useragent", {
          username,
          url,
          message: json?.message || "unknown",
        });
        continue;
      }
      const posts = normalizePublicItems(json).slice(0, limit);
      if (posts.length > 0) {
        console.info("[instagram-feed] candidato exitoso", { username, url, posts: posts.length });
        return posts;
      }
      console.warn("[instagram-feed] candidato sin posts parseables", { username, url });
    } catch (error: any) {
      console.error("[instagram-feed] error en candidato", {
        username,
        url,
        error: error?.message || String(error),
      });
      continue;
    }
  }

  try {
    console.info("[instagram-feed] intentando fallback html", { username, limit });
    const profileRes = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 1800 },
    });
    if (!profileRes.ok) {
      console.warn("[instagram-feed] fallback html no ok", { username, status: profileRes.status });
      return [];
    }
    const html = await profileRes.text();
    const edges = extractEdgesFromHtml(html);
    if (edges.length) {
      const posts = normalizePublicEdges(Array.isArray(edges) ? edges : []).slice(0, limit);
      if (posts.length > 0) {
        console.info("[instagram-feed] fallback html parseado por edges", { username, posts: posts.length });
        return posts;
      }
    }
    const loosePosts = extractPostsFromHtmlLoose(html, limit);
    if (loosePosts.length > 0) {
      console.info("[instagram-feed] fallback html parseado por regex flexible", {
        username,
        posts: loosePosts.length,
      });
      return loosePosts;
    }
    console.warn("[instagram-feed] fallback html sin posts parseables", { username });
    return [];
  } catch (error: any) {
    console.error("[instagram-feed] error en fallback html", {
      username,
      error: error?.message || String(error),
    });
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit") || 6);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 12) : 6;
    const username = process.env.INSTAGRAM_USERNAME || "nativa.revestimientos";
    const forceStatic =
      String(process.env.INSTAGRAM_FEED_MODE || "").toLowerCase() === "static" ||
      String(process.env.INSTAGRAM_FEED_FORCE_STATIC || "").toLowerCase() === "true";
    console.info("[instagram-feed] request", { username, limit });
    const cacheKey = username.toLowerCase();
    const cached = feedCache.get(cacheKey);
    const cachedFresh =
      cached && Date.now() - cached.savedAt <= FEED_CACHE_TTL_MS && cached.posts.length > 0;
    const graphPosts = forceStatic ? [] : await getFromGraphApi(limit);
    const fetchedPosts = forceStatic
      ? []
      : (graphPosts.length > 0 ? graphPosts : await getFromPublicProfile(limit, username));
    const hardcoded = getHardcodedPosts(username);
    const posts =
      fetchedPosts.length > 0
        ? fetchedPosts
        : cached?.posts?.length
          ? cached.posts.slice(0, limit)
          : hardcoded.slice(0, limit);
    if (fetchedPosts.length > 0) feedCache.set(cacheKey, { savedAt: Date.now(), posts: fetchedPosts });
    const source = forceStatic
      ? "hardcoded"
      : graphPosts.length > 0
        ? "instagram-graph"
        : fetchedPosts.length > 0
          ? "instagram-public"
        : cached?.posts?.length
          ? (cachedFresh ? "cache" : "cache-stale")
          : "hardcoded";
    const proxiedPosts = posts.map((post) => ({
      ...post,
      mediaUrl: toProxyMediaUrl(request.url, post.mediaUrl),
    }));
    const response = NextResponse.json({
      username,
      profileUrl: `https://www.instagram.com/${username}/`,
      source,
      posts: proxiedPosts,
    });
    console.info("[instagram-feed] response", { username, source, posts: proxiedPosts.length });
    return response;
  } catch (error: any) {
    console.error("[instagram-feed] error", {
      error: error?.message || "instagram_feed_error",
    });
    return NextResponse.json(
      {
        username: "nativa.revestimientos",
        profileUrl: "https://www.instagram.com/nativa.revestimientos/",
        source: "fallback",
        posts: [],
        error: error?.message || "instagram_feed_error",
      },
      { status: 200 },
    );
  }
}
