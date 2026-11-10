"use client";

import { ProjectInfo as ProjectInfoType } from '@/types/project';
import { motion } from 'framer-motion';
import { satoshi } from '@/styles/fonts';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ProjectInfoProps {
  info: ProjectInfoType;
}

const ProjectInfo = ({ info }: ProjectInfoProps) => {
  // Imágenes para el mosaico horizontal: usar las definidas en el proyecto si existen
  const galleryImages = info.images && info.images.length >= 5
    ? info.images
    : [
        '/images/obra-deck.jpg',
        '/images/obra-cocina.jpg', 
        '/images/obra-estanteria.jpg',
        '/images/obra-mesa-comedor.jpg',
        '/images/obra-puertas.jpg'
      ];

  return (
    <section className="py-16 sm:py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Icono superior */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </motion.div>

        {/* Título principal */}
          <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={cn([satoshi.className, "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 uppercase tracking-wide mb-8 leading-tight"])}
        >
          {info.title}
        </motion.h1>
        
        {/* Descripción en párrafos centrados */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-4xl mx-auto mb-12 space-y-4"
        >
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
            {info.description}
          </p>
          
          {/* Párrafo adicional si hay features */}
          {info.features.length > 0 && (
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
              A su vez, a diferencia de los sistemas tradicionales, son amigables con el medio ambiente y no requieren mantenimiento alguno.
            </p>
          )}
        </motion.div>

        {/* Galería horizontal como en la imagen - bordes muy redondeados */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mb-12"
        >
          <div className="max-w-7xl mx-auto">
            {/* Container con bordes súper redondeados como píldoras */}
            <div className="bg-gray-100 p-2 sm:p-3 rounded-[2rem] sm:rounded-[3rem] shadow-lg">
              <div className="flex items-end gap-1 sm:gap-2 h-[200px] sm:h-[300px] lg:h-[400px]">
                
                {/* Primera imagen - pequeña (izquierda) */}
                <div className="flex-[2] relative group overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] h-[60%]">
                  <Image
                    src={galleryImages[0]}
                    alt="Proyecto 1"
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>
                
                {/* Segunda imagen - mediana */}
                <div className="flex-[3] relative group overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] h-[80%]">
                  <Image
                    src={galleryImages[1]}
                    alt="Proyecto 2"
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>
                
                {/* Tercera imagen - la más grande (centro) */}
                <div className="flex-[4] relative group overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] h-[100%]">
                  <Image
                    src={galleryImages[2]}
                    alt="Proyecto 3 - Principal"
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>
                
                {/* Cuarta imagen - mediana */}
                <div className="flex-[3] relative group overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] h-[80%]">
                  <Image
                    src={galleryImages[3]}
                    alt="Proyecto 4"
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>
                
                {/* Quinta imagen - pequeña (derecha) */}
                <div className="flex-[2] relative group overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] h-[60%]">
                  <Image
                    src={galleryImages[4]}
                    alt="Proyecto 5"
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Texto de conclusión/garantía */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {info.stats && info.stats.length > 0 && (
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 uppercase tracking-wide leading-tight">
              NUESTROS PROYECTOS CUENTAN CON {info.stats[0].number}{info.stats[0].suffix} {info.stats[0].label}
            </h2>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectInfo;
