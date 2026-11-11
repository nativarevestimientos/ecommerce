"use client";

import Script from "next/script";

const InstagramGrid = () => {
  return (
    <section className="max-w-frame mx-auto p-4">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900">Nativa en Instagram</h3>
      </div>

      <div className="sk-instagram-feed" data-embed-id="25729012" />
      <Script
        src="https://widgets.sociablekit.com/instagram-feed/widget.js"
        strategy="afterInteractive"
      />
    </section>
  );
};

export default InstagramGrid;
