"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CyberCampaign } from "@/types/cyber-campaign";
import { Product } from "@/types/product";
import { isPromotionProduct } from "@/lib/promotions";

type CampaignState = {
  campaign: CyberCampaign | null;
  products: Product[];
  active: boolean;
  loading: boolean;
  remaining: number;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
};
const Context = createContext<CampaignState>({ campaign: null, products: [], active: false, loading: true, remaining: 0, modalOpen: false, setModalOpen: () => {} });
export const useCyberCampaign = () => useContext(Context);

export function CyberCampaignProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [campaign, setCampaign] = useState<CyberCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [now, setNow] = useState(0);
  const [modalOpen, setModalOpenState] = useState(false);
  const clock = useRef({ server: 0, received: 0 });
  const shown = useRef(new Set<string>());
  const excluded = /^\/(checkout|cart|auth|account|login|register|payment)(\/|$)/.test(pathname);

  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    const refresh = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const response = await fetch("/api/promotions", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Campaign unavailable");
        const data = await response.json();
        if (controller.signal.aborted) return;
        clock.current = { server: data.serverNow, received: performance.now() };
        setNow(data.serverNow);
        setCampaign(data.campaign);
        if (data.campaign?.enabled) {
          const res = await fetch("/api/products?all=1", { cache: "no-store", signal: controller.signal });
          if (!res.ok) throw new Error("Products unavailable");
          const items = await res.json();
          if (!Array.isArray(items)) throw new Error("Invalid products");
          if (!controller.signal.aborted) setCatalog(items);
        } else setCatalog([]);
      } catch {
        // Fail closed rather than advertising a campaign we cannot verify.
        if (!controller.signal.aborted) { setCampaign(null); setCatalog([]); }
      } finally { busy = false; if (!controller.signal.aborted) setLoading(false); }
    };
    void refresh();
    const refreshId = window.setInterval(refresh, 60000);
    const tick = window.setInterval(() => {
      if (clock.current.server) setNow(clock.current.server + performance.now() - clock.current.received);
    }, 1000);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { controller.abort(); clearInterval(refreshId); clearInterval(tick); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  const start = Date.parse(campaign?.startsAt || "");
  const end = Date.parse(campaign?.endsAt || "");
  const active = Boolean(campaign?.enabled && now >= start && now < end && !excluded);
  const eligible = campaign ? catalog.filter((p) => isPromotionProduct(campaign, p)) : [];
  const products = (campaign?.selectionMode === "manual"
    ? campaign.productIds.map((id) => eligible.find((p) => p.id === id)).filter((p): p is Product => Boolean(p))
    : eligible.sort((a, b) => a.id.localeCompare(b.id)))
    .slice(0, Math.min(3, Math.max(1, campaign?.maxProducts || 3)));
  const ready = products.length > 0;
  const setModalOpen = (open: boolean) => {
    if (open && campaign) {
      const key = `nativa:cyber:${campaign.id}`;
      shown.current.add(key);
      try { localStorage.setItem(key, String(Date.now())); } catch { /* Storage can be blocked. */ }
    }
    setModalOpenState(open);
  };

  useEffect(() => {
    if (!active || !ready || !campaign?.popupEnabled) return;
    const key = `nativa:cyber:${campaign.id}`;
    if (shown.current.has(key)) return;
    const cooldown = Math.max(1, campaign.popupCooldownHours || 24) * 3600000;
    const alreadySeen = () => {
      try { const last = Number(localStorage.getItem(key)); return last > 0 && Date.now() - last < cooldown; } catch { return false; }
    };
    if (alreadySeen()) return;
    const timer = window.setTimeout(() => {
      if (document.hidden || document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"]') || alreadySeen()) return;
      if (shown.current.has(key)) return;
      shown.current.add(key);
      try { localStorage.setItem(key, String(Date.now())); } catch { /* Storage can be blocked. */ }
      setModalOpenState(true);
    }, Math.min(60, Math.max(3, campaign.popupDelaySeconds || 6)) * 1000);
    return () => clearTimeout(timer);
  }, [active, ready, campaign?.id, campaign?.popupEnabled, campaign?.popupCooldownHours, campaign?.popupDelaySeconds, pathname]);

  useEffect(() => { if (!active) setModalOpenState(false); }, [active, pathname]);

  return <Context.Provider value={{ campaign, products, active, loading, remaining: Math.max(0, Math.ceil((end - now) / 1000)) || 0, modalOpen, setModalOpen }}>{children}</Context.Provider>;
}

export const usePromotionCampaign = useCyberCampaign;
export const PromotionCampaignProvider = CyberCampaignProvider;
