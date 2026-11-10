"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Tag, Timer, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePromotionCampaign as useCyberCampaign } from "@/context/PromotionCampaignContext";
import { promotionName, promotionLogo, promotionHref } from "@/lib/promotions";
import ProductCard from "@/components/common/ProductCard";
import styles from "./cyber-monday.module.css";

// Original asset from the official event website; no recoloring or distortion.
export { CYBER_LOGO_URL } from "@/lib/promotions";

function Logo({ small = false }: { small?: boolean }) {
  const { campaign } = useCyberCampaign();
  const [failedUrl, setFailedUrl] = useState("");
  if (!campaign) return null;
  const url = promotionLogo(campaign);
  if (!url || failedUrl === url) return <span className={`${styles.nameLogo} ${small ? styles.smallNameLogo : ""}`}><Tag size={small ? 20 : 24} /><span>{promotionName(campaign)}</span></span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} width={small ? 54 : 120} height={small ? 44 : 79} alt={promotionName(campaign)} className={styles.logo} onError={() => setFailedUrl(url)} />;
}

function Countdown({ compact = false }: { compact?: boolean }) {
  const { remaining, campaign } = useCyberCampaign();
  const values = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
  const labels = ["Días", "Horas", "Min", "Seg"];
  const endLabel = campaign ? new Date(campaign.endsAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
  return <div className={`${styles.countdown} ${compact ? styles.compact : ""}`} role="timer" aria-label={`Las ofertas finalizan el ${endLabel}, hora Argentina`}>
    {values.map((value, index) => <div key={labels[index]} className={styles.timeUnit} aria-hidden="true"><span className={styles.digits}>{String(value).padStart(2, "0")}</span><span className={styles.timeLabel}>{labels[index]}</span></div>)}
  </div>;
}

function CampaignDeadline() {
  const { campaign } = useCyberCampaign();
  if (!campaign) return null;
  const end = new Date(campaign.endsAt).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  return <p className={styles.deadline}>Hasta el {end} h</p>;
}

export function CyberMondayBar() {
  const { active, campaign, setModalOpen } = useCyberCampaign();
  const [detached, setDetached] = useState(false);
  useEffect(() => {
    const onScroll = () => setDetached(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!active || !campaign) return null;
  return <aside className={styles.bar} data-promotion-bar data-detached={detached} aria-label={`Promoción ${promotionName(campaign)}`}><div className={styles.barInner}>
    <div className={styles.barBrand}><Logo small /><span><strong>{campaign.extended ? "¡Extendimos las ofertas!" : `${promotionName(campaign)} en Nativa`}</strong></span></div>
    <div className={styles.barActions}><Countdown compact /><button type="button" className={styles.barButton} onClick={() => setModalOpen(true)}>Ver ofertas <ArrowUpRight size={16} /></button></div>
  </div></aside>;
}

export function CyberMondayModal() {
  const { active, campaign, products, modalOpen, setModalOpen } = useCyberCampaign();
  if (!active || !campaign) return null;
  const offersUrl = promotionHref(campaign);
  return <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}><Dialog.Portal>
    <Dialog.Overlay className={styles.overlay} />
    <Dialog.Content className={styles.modal} onCloseAutoFocus={(event) => {
      event.preventDefault();
      document.querySelector<HTMLButtonElement>('[data-promotion-bar] button')?.focus();
    }}>
      <Dialog.Close className={styles.close} aria-label="Cerrar promoción"><X size={20} /></Dialog.Close>
      <div className={styles.modalScroll}>
      <div className={styles.modalHeader}>
        <Logo />
        {campaign.extended && <span className={styles.status}>¡EXTENDIMOS LAS OFERTAS!</span>}
      </div>
      <Dialog.Title className={styles.modalTitle}>{campaign.title}</Dialog.Title>
      <Dialog.Description className={styles.description}>{campaign.description}</Dialog.Description>
      {products.length > 0 && <div className={styles.modalProducts} data-count={Math.min(products.length, 3)} role="region" aria-label={`Productos ${promotionName(campaign)}`} tabIndex={0}>{products.slice(0, 3).map((p) => <ProductCard key={p.id} data={p} variant="popup" onNavigate={() => setModalOpen(false)} />)}</div>}
      <div className={styles.modalTimer}>
        <div className={styles.modalTimerHeader}><Timer size={14} /> Termina en</div>
        <Countdown />
        <CampaignDeadline />
      </div>
      {campaign.terms && <details className={styles.conditions}><summary>Condiciones de la promoción</summary><p className={styles.terms}>{campaign.terms}</p></details>}
      </div>
      <div className={styles.modalFooter}>
       <Link href={offersUrl} className={styles.cta} onClick={() => setModalOpen(false)}>{campaign.buttonText}<ArrowRight size={18} /></Link>
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
