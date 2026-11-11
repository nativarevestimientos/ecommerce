"use client";

import React from "react";
import { motion } from "framer-motion";
import { satoshi } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const proyectosDestacados = [
  {
    id: 1,
    titulo: "Cocinas Modernas",
    descripcion: "Diseñamos y construimos cocinas únicas que combinan funcionalidad con estilo contemporáneo.",
    imagen: "/images/home/hero/desktop/05.webp",
    url: "/obras/cocinas-modernas",
    categoria: "Cocinas",
    stats: "150+ proyectos realizados"
  },
  {
    id: 2,
    titulo: "Decks Exteriores",
    descripcion: "Espacios exteriores que resisten el tiempo y embellecen tu hogar con maderas seleccionadas.",
    imagen: "/images/home/hero/desktop/06.webp",
    url: "/obras/decks-exteriores",
    categoria: "Exteriores",
    stats: "200+ decks construidos"
  },
  {
    id: 3,
    titulo: "Muebles a Medida",
    descripcion: "Mobiliario personalizado que se adapta perfectamente a tu espacio y necesidades.",
    imagen: "/images/home/hero/desktop/07.webp",
    url: "/obras/muebles-medida",
    categoria: "Mobiliario",
    stats: "500+ muebles creados"
  }
];

const ProyectosDestacados = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <section className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h2
            initial={{ y: "100px", opacity: 0 }}
            whileInView={{ y: "0", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={cn([satoshi.className, "text-4xl lg:text-6xl font-bold mb-8 text-gray-900"])}
          >
            PROYECTOS DESTACADOS
          </motion.h2>
          <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Descubre algunos de nuestros trabajos más representativos y conoce 
            la calidad que nos caracteriza en cada proyecto
          </p>
        </motion.div>

        {/* Projects Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16"
        >
          {proyectosDestacados.map((proyecto) => (
            <motion.article
              key={proyecto.id}
              variants={itemVariants}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={proyecto.imagen}
                  alt={proyecto.titulo}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300" />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm text-black px-3 py-1 rounded-full text-sm font-semibold">
                    {proyecto.categoria}
                  </span>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="bg-white rounded-full p-3">
                    <ExternalLink className="h-6 w-6 text-black" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 group-hover:text-black transition-colors">
                  {proyecto.titulo}
                </h3>

                <p className="text-gray-600 leading-relaxed mb-4">
                  {proyecto.descripcion}
                </p>

                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-500 font-medium">
                    {proyecto.stats}
                  </span>
                </div>

                {/* CTA Button */}
                <Link href={proyecto.url}>
                  <Button className="w-full bg-black hover:bg-gray-800 text-white group/btn">
                    Ver Proyecto
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center bg-black rounded-3xl p-12 lg:p-16 text-white"
        >
          <h3 className="text-3xl lg:text-4xl font-bold mb-6">
            ¿Tienes un proyecto en mente?
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Desde cocinas modernas hasta decks exteriores, creamos espacios únicos 
            que reflejan tu personalidad y estilo de vida
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/obras">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-4">
                Ver Todos los Proyectos
              </Button>
            </Link>
            <Link href="tel:01121781148">
              <Button variant="outline" size="lg" className="btn bg-[rgb(var(--brand-600))] text-white border-white hover:bg-white hover:text-black px-8 py-4">
                Solicitar Presupuesto
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProyectosDestacados;
