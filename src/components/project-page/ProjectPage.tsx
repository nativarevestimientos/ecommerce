"use client";

import { Project } from '@/types/project';
import ProjectBanner from '@/components/project-page/sections/ProjectBanner';
import ProjectInfo from '@/components/project-page/sections/ProjectInfo';
import ProjectServices from '@/components/project-page/sections/ProjectServices';
import ProjectGallery from '@/components/project-page/sections/ProjectGallery';
// import ProjectTestimonials from '@/components/project-page/sections/ProjectTestimonials'; // OCULTO
import ProjectFAQs from '@/components/project-page/sections/ProjectFAQs';
import ProjectContact from '@/components/project-page/sections/ProjectContact';
import { motion } from 'framer-motion';

interface ProjectPageProps {
  project: Project;
}

const ProjectPage = ({ project }: ProjectPageProps) => {
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Banner siempre presente */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <ProjectBanner banner={project.banner} />
      </motion.div>

      {/* Renderizar secciones dinámicamente basado en la configuración */}
      <div className="space-y-0">
        {project.info && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
          >
            <ProjectInfo info={project.info} />
          </motion.div>
        )}

        {project.services && project.services.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
          >
            <ProjectServices services={project.services} />
          </motion.div>
        )}

        {project.gallery && project.gallery.items.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
          >
            <ProjectGallery gallery={project.gallery} />
          </motion.div>
        )}

        {/* Sección de Testimonials - OCULTA */}
        {/* {project.testimonials && project.testimonials.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
          >
            <ProjectTestimonials testimonials={project.testimonials} />
          </motion.div>
        )} */}

        {project.faqs && project.faqs.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
          >
            <ProjectFAQs faqs={project.faqs} />
          </motion.div>
        )}

        {project.contact && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
          >
            <ProjectContact contact={project.contact} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectPage;