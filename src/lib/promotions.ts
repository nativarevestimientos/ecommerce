import { PromotionCampaign, PromotionType } from "@/types/promotion";
import { Product } from "@/types/product";

export const CYBER_LOGO_URL = "https://assets.cybermonday.com.ar/assets/2026/imgs/icons/cybermonday.svg";
export function promotionType(campaign: PromotionCampaign): PromotionType { return campaign.type || "cyberMonday"; }
export function promotionName(campaign: PromotionCampaign): string {
  return campaign.name?.trim() || ({ cyberMonday: "CyberMonday", blackFriday: "Black Friday", custom: "Promoción Nativa" }[promotionType(campaign)]);
}
export function promotionLogo(campaign: PromotionCampaign): string {
  const value = campaign.logoUrl === undefined ? (promotionType(campaign) === "cyberMonday" ? CYBER_LOGO_URL : "") : campaign.logoUrl;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : ""; } catch { return ""; }
}
export function isPromotionProduct(campaign: PromotionCampaign, product: Product): boolean {
  const type = promotionType(campaign);
  return product.active && product.stock > 0 && (type === "custom" ? campaign.productIds.includes(product.id) : product[type] === true);
}
export function promotionHref(campaign: PromotionCampaign): string {
  return promotionType(campaign) === "custom" ? `/shop?promotion=${encodeURIComponent(campaign.id)}` : `/shop?filter=${promotionType(campaign)}`;
}
