"use client"

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import TopBanner from "@/components/layout/Banner/TopBanner";
import TopNavbar from "@/components/layout/Navbar/TopNavbar";
import Footer from "@/components/layout/Footer";
import { FilterProvider } from "@/context/FilterContext";
import { ToastProvider } from "@/context/ToastContext";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { Toaster } from "@/components/ui/toaster";
import { PromotionCampaignProvider } from "@/context/PromotionCampaignContext";
import { PromotionBar, PromotionModal } from "@/components/campaign/PromotionCampaign";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as typeof window & { fbq?: (...args: any[]) => void };
    if (typeof w.fbq !== "function") return;
    w.fbq("track", "PageView");
  }, [pathname, searchParams]);

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))]">
      <FilterProvider>
        <ToastProvider>
          <PromotionCampaignProvider>
            <ServiceWorkerRegistration />
            <TopBanner />
            <div data-store-header className="sticky top-0 z-30">
              <TopNavbar />
              <PromotionBar />
            </div>
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <Toaster />
            <PromotionModal />
          </PromotionCampaignProvider>
        </ToastProvider>
      </FilterProvider>
    </div>
  );
} 
