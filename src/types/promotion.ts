export type PromotionType = "cyberMonday" | "blackFriday" | "custom";

export interface PromotionCampaign {
  id: string;
  type?: PromotionType;
  name?: string;
  logoUrl?: string;
  enabled: boolean;
  startsAt: string;
  endsAt: string;
  extended: boolean;
  title: string;
  description: string;
  buttonText: string;
  terms: string;
  selectionMode: "automatic" | "manual";
  productIds: string[];
  maxProducts: number;
  popupEnabled: boolean;
  popupDelaySeconds: number;
  popupCooldownHours: number;
}
