import { Metadata } from 'next';
import { getAllProjects } from '@/lib/projects';
import ProjectsListPage from '@/components/project-page/ProjectsListPage';

export const metadata: Metadata = {
  title: 'Nuestros Obras - Nativa',
  description: 'Descubre todos nuestros obras de carpintería, construcción y obras especializadas en madera.',
  keywords: [
    'obras', 'carpintería', 'construcción', 'maderas',
    'obras', 'trabajos', 'galería', 'portfolio'
  ],
  openGraph: {
    title: 'Nuestros Obras - Nativa',
    description: 'Descubre todos nuestros obras de carpintería, construcción y obras especializadas en madera.',
    type: 'website',
  },
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  const activeProjects = projects.filter(project => project.status === 'active');

  return <ProjectsListPage projects={activeProjects} />;
}
