import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

function isAllowedInstagramMediaHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host.endsWith(".cdninstagram.com") ||
    host.endsWith(".fbcdn.net") ||
    host.endsWith(".instagram.com") ||
    host === "cdninstagram.com" ||
    host === "fbcdn.net" ||
    host === "instagram.com"
  );
}

export async function GET(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    const media = reqUrl.searchParams.get("url") || "";
    if (!media) {
      return new NextResponse("missing_url", { status: 400 });
    }

    const mediaUrl = new URL(media);
    if (mediaUrl.protocol !== "https:") {
      return new NextResponse("invalid_protocol", { status: 400 });
    }

    if (!isAllowedInstagramMediaHost(mediaUrl.hostname)) {
      return new NextResponse("invalid_host", { status: 400 });
    }

    const upstream = await fetch(mediaUrl.toString(), {
      headers: {
        Accept: "image/*,video/*,*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
      },
      next: { revalidate: 1800 },
    });

    if (!upstream.ok) {
      return new NextResponse("upstream_error", { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const cacheControl = upstream.headers.get("cache-control") || "public, max-age=1800, s-maxage=1800";
    const data = await upstream.arrayBuffer();

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("instagram_media_proxy_error", { status: 500 });
  }
}
