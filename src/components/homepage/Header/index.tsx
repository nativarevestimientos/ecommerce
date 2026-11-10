import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as motion from "framer-motion/client";

type BannerItem = {
  id: string;
  imagenUrl: string;
  imagenUrlMobile: string;
  href?: string;
};

const Header = () => {
  const urlsDesktop = useMemo(
    () => [
      "/images/home/hero/desktop/09.jpg",
      "/images/home/hero/desktop/05.png",
      "/images/home/hero/desktop/06.png",
      "/images/home/hero/desktop/07.png",
      "/images/home/hero/desktop/08.png",
    ],
    [],
  );
  const urlsMobile = useMemo(
    () => [
      "/images/home/hero/mobile/09.jpg",
      "/images/home/hero/mobile/05.png",
      "/images/home/hero/mobile/06.png",
      "/images/home/hero/mobile/07.png",
      "/images/home/hero/mobile/08.png",
    ],
    [],
  );

  const banners: BannerItem[] = useMemo(() => {
    const total = Math.max(urlsDesktop.length, urlsMobile.length);
    return Array.from({ length: total }).map((_, idx) => {
      const desktop = urlsDesktop[idx] ?? urlsMobile[idx] ?? "";
      const mobile = urlsMobile[idx] ?? urlsDesktop[idx] ?? "";
      return {
        id: String(idx + 1),
        imagenUrl: desktop,
        imagenUrlMobile: mobile,
        href: /\/09\.(png|jpg)$/.test(desktop) ? "/shop?filter=cyberMonday" : undefined,
      };
    });
  }, [urlsDesktop, urlsMobile]);

  const [indice, setIndice] = useState(0);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const pausaAutoPlayRef = useRef(false);
  useEffect(() => {
    setIndice((current) => current % Math.max(1, banners.length));
  }, [banners.length]);
  const prefiereReducido = useMemo(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const irA = useCallback(
    (nuevo: number) => {
      const total = banners.length;
      if (total === 0) return;
      const normalizado = ((nuevo % total) + total) % total;
      setIndice(normalizado);
    },
    [banners.length]
  );

  // Autoplay con pausa al hover/teclado/visibilidad
  useEffect(() => {
    if (prefiereReducido) return;
    const id = setInterval(() => {
      if (!pausaAutoPlayRef.current) irA(indice + 1);
    }, 5000);
    return () => clearInterval(id);
  }, [indice, irA, prefiereReducido]);

  useEffect(() => {
    const onVisibility = () => {
      pausaAutoPlayRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onMouseEnter = () => (pausaAutoPlayRef.current = true);
  const onMouseLeave = () => (pausaAutoPlayRef.current = false);

  // Navegación por teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!contenedorRef.current) return;
      if (e.key === "ArrowRight") irA(indice + 1);
      if (e.key === "ArrowLeft") irA(indice - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [indice, irA]);

  // Swipe con framer-motion
  const dragThreshold = 80;

  return (
    <section aria-roledescription="carousel" aria-label="Banner principal" className="relative w-full overflow-hidden bg-black">
      <div
        ref={contenedorRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] xl:h-[75vh]"
      >
        <motion.div
          className="flex h-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -dragThreshold) irA(indice + 1);
            if (info.offset.x > dragThreshold) irA(indice - 1);
          }}
          animate={{ x: `-${(indice * 100) / banners.length}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{ width: `${banners.length * 100}%` }}
        >
          {banners.map((b, i) => {
            const isCyberMondayBanner = /\/09\.(png|jpg)$/.test(b.imagenUrl);
            const bannerNumber = b.imagenUrl.match(/\/(\d+)\.png$/)?.[1] ?? String(i + 1);
            const picture = (
              <picture>
                <source media="(max-width: 767px)" srcSet={b.imagenUrlMobile} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.imagenUrl}
                  alt={isCyberMondayBanner ? "Banner Cyber Monday" : `Banner ${bannerNumber}`}
                  className="w-full h-full object-cover object-center"
                />
              </picture>
            );

            return (
              <div key={b.id} className="relative w-full h-full shrink-0" style={{ width: `${100 / banners.length}%` }}>
                <div className="w-full h-full relative">
                  {b.href ? (
                    <a href={b.href} aria-label="Ver productos Cyber Monday" className="block w-full h-full">
                      {picture}
                    </a>
                  ) : picture}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Controles */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 sm:px-4 md:px-6">
          <button
            type="button"
            onClick={() => irA(indice - 1)}
            aria-label="Anterior"
            className="pointer-events-auto inline-flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-black/30 hover:bg-black/40 text-white backdrop-blur-sm transition shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-white/40"
          >
            <span aria-hidden className="text-sm sm:text-base md:text-lg">‹</span>
          </button>
          <button
            type="button"
            onClick={() => irA(indice + 1)}
            aria-label="Siguiente"
            className="pointer-events-auto inline-flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-black/30 hover:bg-black/40 text-white backdrop-blur-sm transition shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-white/40"
          >
            <span aria-hidden className="text-sm sm:text-base md:text-lg">›</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Header;
