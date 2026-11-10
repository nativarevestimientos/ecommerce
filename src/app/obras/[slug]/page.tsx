import { notFound } from 'next/navigation';
import { getProjectBySlug, getAllProjectSlugs } from '@/lib/projects';
import ProjectPage from '@/components/project-page/ProjectPage';

interface ProjectPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const project = await getProjectBySlug(params.slug);

  if (!project || project.status !== 'active') {
    notFound();
  }

  return <ProjectPage project={project} />;
}
