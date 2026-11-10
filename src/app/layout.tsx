import type { Metadata } from "next";
import "./globals.css";
import { satoshi } from "@/styles/fonts";
import RootLayoutClient from "./root-layout-client";
import Providers from "./providers";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import Script from "next/script";

const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "950826434344006").trim();
const GA_MEASUREMENT_ID = "G-D66BVLFYLR";
const GOOGLE_ADS_ID = "AW-16555042880";

export const metadata: Metadata = {
  title: "Nativa Revestimientos",
  description:
    "Decks, wall panels (WPC/PVC/EPS), revestimientos en madera nativa, placas PVC/símil madera, piedra flex y accesorios. Asesoramiento y distribución en Buenos Aires.",
  keywords: [
    "nativa revestimientos",
    "revestimientos",
    "revestimientos interiores",
    "revestimientos exteriores",
    "wall panels",
    "wall panel",
    "wall panels wpc",
    "wall panels pvc",
    "wall panels eps",
    "revestimientos en madera",
    "madera nativa",
    "decks",
    "deck wpc",
    "tablas deck",
    "tablas deck wpc",
    "placas pvc",
    "placas símil madera",
    "placas simil madera",
    "piedra flex",
    "piedra flexible",
    "terminaciones",
    "accesorios",
    "proyectos a medida",
    "buenos aires",
    "argentina"
  ],
  authors: [{ name: "Nativa" }],
  creator: "Nativa",
  publisher: "Nativa",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://nativarevestimientos.com.ar'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Nativa Revestimientos",
    description:
      "Decks, wall panels (WPC/PVC/EPS), revestimientos en madera nativa, placas PVC/símil madera, piedra flex y accesorios. Asesoramiento y distribución en Buenos Aires.",
    url: "https://nativarevestimientos.com.ar",
    siteName: "Nativa",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Nativa Revestimientos",
    description:
      "Decks, wall panels (WPC/PVC/EPS), revestimientos en madera nativa, placas PVC/símil madera, piedra flex y accesorios. Asesoramiento y distribución en Buenos Aires.",
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = headers();
  const host = (hdrs.get("x-forwarded-host") || hdrs.get("host") || "")
    .toLowerCase()
    .split(",")[0]
    ?.trim();
  const isTargetDomain =
    host === "nativarevestimientos.com.ar" || host === "www.nativarevestimientos.com.ar";
  const maintenanceFlag = process.env.NEXT_PUBLIC_MAINTENANCE_MODE;
  const isMaintenance =
    process.env.NODE_ENV === "production" && isTargetDomain && maintenanceFlag !== "false";

  return (
    <html lang="es" className={cn(satoshi.variable)}>
      <head>
        <meta name="geo.region" content="AR" />
        <meta name="geo.placename" content="Argentina" />
        {isMaintenance && <meta name="robots" content="noindex,nofollow" />}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>
        {META_PIXEL_ID && (
          <Script id="meta-pixel-base" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Nativa",
                url: "https://nativarevestimientos.com.ar",
                logo: "https://nativarevestimientos.com.ar/images/og-image.jpg",
                telephone: "01121781148",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Av. Dr. Honorio Pueyrredón 4625",
                  postalCode: "B1631",
                  addressLocality: "Villa Rosa",
                  addressRegion: "Provincia de Buenos Aires",
                  addressCountry: "AR",
                },
                sameAs: [
                  "https://www.instagram.com/nativa.revestimientos",
                  "https://www.facebook.com/profile.php?id=61578345904014&mibextid=ZbWKwL",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Nativa",
                url: "https://nativarevestimientos.com.ar",
                inLanguage: "es-AR",
              },
              {
                "@context": "https://schema.org",
                "@type": "HardwareStore",
                name: "Nativa",
                url: "https://nativarevestimientos.com.ar",
                areaServed: "AR",
                telephone: "01121781148",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Av. Dr. Honorio Pueyrredón 4625",
                  postalCode: "B1631",
                  addressLocality: "Villa Rosa",
                  addressRegion: "Provincia de Buenos Aires",
                  addressCountry: "AR",
                },
                sameAs: [
                  "https://www.instagram.com/nativa.revestimientos",
                  "https://www.facebook.com/profile.php?id=61578345904014&mibextid=ZbWKwL",
                ],
                hasMap: "https://maps.app.goo.gl/7yjPAd41fKKH9ErF9",
              },
            ]),
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-[rgb(var(--page-bg))] antialiased")}>
        {META_PIXEL_ID && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        )}
        {isMaintenance ? (
          <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="surface-card rounded-2xl border border-[rgb(var(--brand-200))] p-8 w-full max-w-xl text-center">
              <h1 className={cn([satoshi.className, "text-3xl font-bold text-[rgb(var(--brand-900))]"])}>
                Sitio en desarrollo
              </h1>
              <p className="mt-3 text-[rgb(var(--brand-700))]">
                Estamos preparando nativarevestimientos.com.ar. Muy pronto vas a poder comprar online.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://wa.me/541121781148"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                >
                  WhatsApp
                </a>
                <a
                  href="tel:01121781148"
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 btn-surface font-semibold"
                >
                  Llamar
                </a>
              </div>
              <p className="mt-6 text-sm text-[rgb(var(--brand-600))]">
                Si ya tenés un pedido en curso, escribinos y te ayudamos.
              </p>
            </div>
          </div>
        ) : (
          <Providers>
            <RootLayoutClient>{children}</RootLayoutClient>
          </Providers>
        )}
      </body>
    </html>
  );
}
