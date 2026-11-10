"use client";

import React from "react";
import * as motion from "framer-motion/client";
import Image from "next/image";
import Link from "next/link";
import { satoshi } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { projectsData } from "@/data/projects";
import { Project } from "@/types/project";

const Obras = () => {
  // Obtener solo proyectos activos
  const activeProjects = projectsData.filter(project => project.status === 'active');

  return (
    <div className="px-4 xl:px-0">
      <section id="obras" className="max-w-frame mx-auto px-4 md:px-6 py-16 md:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.h2
            initial={{ y: "100px", opacity: 0 }}
            whileInView={{ y: "0", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={cn([satoshi.className, "text-2xl font-bold text-center ml-8 md:ml-0"])}
          >
            Nuestras Obras
          </motion.h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mt-4 sm:mt-6">
            Descubre la excelencia de nuestro trabajo a través de proyectos realizados 
            con pasión, calidad y la mejor selección de maderas
          </p>
        </motion.div>

        {/* Galería */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {activeProjects.map((project, index) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <Link href={`/obras/${project.slug}`}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
                  {/* Imagen */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={project.banner.slides[0]?.backgroundImage || '/placeholder.png'}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Categoría */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-3 py-1.5 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-800 rounded-full">
                        {project.category}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {project.banner.slides[0]?.description || project.seo.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <a
            href="/obras"
            className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105"
          >
            Ver Todas las Obras
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </section>
    </div>
  );
};

export default Obras;
