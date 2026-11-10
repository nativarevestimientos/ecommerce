"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ExternalLink, Instagram } from "lucide-react";

type InstagramPost = {
  id: string;
  caption: string;
  mediaUrl: string;
  permalink: string;
  timestamp: string;
  mediaType: string;
};

type InstagramFeedResponse = {
  username: string;
  profileUrl: string;
  source: string;
  posts: InstagramPost[];
};

const placeholderItems = new Array(6).fill(0);

function getMediaLabel(mediaType: string): string {
  const type = (mediaType || "").toUpperCase();
  if (type.includes("REEL") || type.includes("VIDEO")) return "Reel";
  if (type.includes("CAROUSEL") || type.includes("ALBUM")) return "Carrusel";
  return "Post";
}

function getPostLink(post: InstagramPost): string {
  const link = post?.permalink || "";
  if (!link) return "https://www.instagram.com/";
  if ((post.mediaType || "").toUpperCase().includes("REEL") || (post.mediaType || "").toUpperCase().includes("VIDEO")) {
    return link.replace("/p/", "/reel/");
  }
  return link;
}

const InstagramGrid: React.FC = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [profileUrl, setProfileUrl] = useState("https://www.instagram.com/nativa.revestimientos/");
  const [username, setUsername] = useState("nativa.revestimientos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        console.info("[instagram-grid] solicitando feed");
        const res = await fetch("/api/instagram/feed?limit=6", { cache: "no-store" });
        if (!res.ok) {
          console.error("[instagram-grid] respuesta no ok", { status: res.status });
          throw new Error("instagram_feed_error");
        }
        const data = (await res.json()) as InstagramFeedResponse;
        const normalizedPosts = Array.isArray(data?.posts) ? data.posts.slice(0, 6) : [];
        setPosts(normalizedPosts);
        setProfileUrl(data?.profileUrl || "https://www.instagram.com/nativa.revestimientos/");
        setUsername(data?.username || "nativa.revestimientos");
        console.info("[instagram-grid] feed cargado", {
          source: data?.source || "unknown",
          posts: normalizedPosts.length,
          username: data?.username || "nativa.revestimientos",
        });
      } catch (error: any) {
        console.error("[instagram-grid] error cargando feed", {
          error: error?.message || "instagram_feed_error",
        });
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const hasFeed = useMemo(() => posts.length > 0, [posts.length]);

  return (
    <section className="max-w-frame mx-auto p-4">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Nativa en Instagram</h3>
          <p className="text-sm text-gray-600">@{username}</p>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[rgb(var(--brand-600))] text-white text-sm font-medium hover:bg-[rgb(var(--brand-700))] transition"
        >
          <Instagram className="w-4 h-4" />
          Ver perfil
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {(loading || !hasFeed ? placeholderItems : posts).map((item, idx) => (
          <div key={loading || !hasFeed ? idx : item.id} className="relative rounded-lg overflow-hidden bg-gray-100 aspect-square group">
            {loading || !hasFeed ? (
              <div className="w-full h-full bg-[linear-gradient(180deg,#f3f4f6,#e5e7eb)] animate-pulse" />
            ) : (
              <>
                <Image
                  loader={({ src }) => src}
                  unoptimized
                  src={item.mediaUrl}
                  alt={item.caption || `Post de Instagram ${idx + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
                <a
                  href={getPostLink(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 z-20"
                  aria-label={`Abrir ${getMediaLabel(item.mediaType).toLowerCase()} de Instagram ${idx + 1}`}
                />
                <div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/30 transition pointer-events-none" />
                <div className="absolute top-2 left-2 z-10 pointer-events-none rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                  {getMediaLabel(item.mediaType)}
                </div>
                <div className="absolute top-2 right-2 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-white/90 rounded-full p-1.5">
                  <ExternalLink className="w-4 h-4 text-gray-800" />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default InstagramGrid;
