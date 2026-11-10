import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjectBySlug } from '@/lib/projects';

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  
  if (!project) {
    return {
      title: 'Proyecto no encontrado - Nativa',
      description: 'El proyecto que buscas no existe o ha sido removido.',
    };
  }

  return {
    title: project.seo.title,
    description: project.seo.description,
    keywords: project.seo.keywords,
    openGraph: {
      title: project.seo.title,
      description: project.seo.description,
      images: [project.seo.ogImage],
      type: 'website',
      siteName: 'Nativa',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.seo.title,
      description: project.seo.description,
      images: [project.seo.ogImage],
    },
    alternates: {
      canonical: project.seo.canonical || `/obras/${params.slug}`,
    },
  };
}

export default function ProjectLayout({ children, params }: ProjectLayoutProps) {
  return (
    <>
      {children}
    </>
  );
}
