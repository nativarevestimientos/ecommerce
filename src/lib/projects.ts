import { Project } from '@/types/project';
import { projectsData } from '@/data/projects';

export async function getAllProjects(): Promise<Project[]> {
  // En el futuro, esto podría venir de una API o base de datos
  return projectsData;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await getAllProjects();
  return projects.find(project => project.slug === slug) || null;
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const projects = await getAllProjects();
  return projects.map(project => project.slug);
}

export async function getProjectsByCategory(category: string): Promise<Project[]> {
  const projects = await getAllProjects();
  return projects.filter(project => 
    project.category === category && project.status === 'active'
  );
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getAllProjects();
  // Retorna los primeros 3 proyectos activos como destacados
  return projects.filter(project => project.status === 'active').slice(0, 3);
}
