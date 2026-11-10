export interface ProjectBannerSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  overlayOpacity?: number;
}

export interface ProjectBanner {
  id: string;
  slides: ProjectBannerSlide[];
  autoplayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
}

export interface ProjectInfo {
  id: string;
  title: string;
  description: string;
  features: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
  }>;
  stats?: Array<{
    id: string;
    number: string;
    label: string;
    suffix?: string;
  }>;
  // Imágenes opcionales para el mosaico de la sección Info
  images?: string[];
}

export interface ProjectService {
  id: string;
  title: string;
  description: string;
  image: string;
  features: string[];
  price?: {
    from: number;
    currency: string;
    unit: string;
  };
  carousel?: Array<{
    id: string;
    title: string;
    image: string;
    description: string;
    price?: {
      from: number;
      currency: string;
      unit: string;
    };
  }>;
}

export interface ProjectGalleryItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  beforeImage?: string;
}

export interface ProjectGallery {
  id: string;
  title: string;
  description: string;
  categories: string[];
  items: ProjectGalleryItem[];
}

export interface ProjectContact {
  id: string;
  title: string;
  description: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  workingHours: Array<{
    day: string;
    hours: string;
  }>;
  socialLinks: Array<{
    platform: string;
    url: string;
    icon: string;
  }>;
}

export interface ProjectTestimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  rating: number;
  avatar?: string;
}

export interface ProjectFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface ProjectSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  canonical?: string;
}

export interface Project {
  slug: string;
  title: string;
  category: string;
  status: 'active' | 'inactive' | 'coming-soon';
  seo: ProjectSEO;
  banner: ProjectBanner;
  info: ProjectInfo;
  services: ProjectService[];
  gallery: ProjectGallery;
  testimonials: ProjectTestimonial[];
  faqs: ProjectFAQ[];
  contact: ProjectContact;
  createdAt: string;
  updatedAt: string;
}

export type ProjectSection = 
  | 'banner'
  | 'info'
  | 'services'
  | 'gallery'
  | 'testimonials'
  | 'faqs'
  | 'contact';

export interface ProjectConfig {
  sections: ProjectSection[];
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  layout?: 'default' | 'modern' | 'minimal';
}
