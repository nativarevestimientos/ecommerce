"use client";

import { Project } from '@/types/project';
import { motion } from 'framer-motion';
import { satoshi } from '@/styles/fonts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Tag, Star, Users, Award, Phone, MessageCircle, Mail, Hammer, Wrench, Building2, RotateCcw, Ship, Paintbrush, User, Send, Facebook, Instagram, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ProjectsListPageProps {
  projects: Project[];
}

// Componente para el icono de WhatsApp
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
  </svg>
);

// Componente para el icono de TikTok
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const ProjectsListPage = ({ projects }: ProjectsListPageProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Servicios especializados
const services: Array<{
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
}> = [
  {
    title: "Muelles",
    description: "Construcción de muelles resistentes con accesorios adicionales como barandas y mantenimiento especializado.",
    icon: Wrench,
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    title: "Pérgolas",
    description: "Pérgolas en variedades de madera, con y sin chapa, precios competitivos y mantenimiento.",
    icon: Hammer,
    color: "text-amber-600",
    bgColor: "bg-amber-100"
  },
  {
    title: "Deck",
    description: "Decks en diferentes variedades de madera con precios competitivos y mantenimiento especializado.",
    icon: Building2,
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  },
  {
    title: "Tablestacado",
    description: "Especialistas en tablestacado para río y laguna: 1, 2 y 3 tablas. Río paradas y lagunas acostadas.",
    icon: RotateCcw,
    color: "text-green-600",
    bgColor: "bg-green-100"
  }
  // {
  //   title: "Marina Flotante",
  //   description: "Marinas flotantes en variedades de maderas con precios competitivos y mantenimiento especializado.",
  //   icon: Ship,
  //   color: "text-teal-600",
  //   bgColor: "bg-teal-100"
  // },
  // {
  //   title: "Diseño en Madera",
  //   description: "Muebles únicos en madera con diseños personalizados, precios competitivos y mantenimiento.",
  //   icon: Paintbrush,
  //   color: "text-purple-600",
  //   bgColor: "bg-purple-100"
  // }
];

  // Obtener todas las categorías únicas
  const categories = ['all', ...Array.from(new Set(projects.map(p => p.category)))];

  // Filtrar proyectos por categoría
  const filteredProjects = selectedCategory === 'all' 
    ? projects 
    : projects.filter(p => p.category === selectedCategory);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = "541121781148";
    const message = "Hola! Me gustaría conocer más sobre sus obras de madera.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner con CTA Principal */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/obra-mesa-comedor.jpg"
            alt="Obras en Madera"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        {/* Overlay con gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        {/* Contenido Hero */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className={cn([satoshi.className, "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6"])}>
                Obras en Madera de Primera Calidad
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
                Transformamos tus ideas en obras maestras de carpintería. 
                Muebles, decks, cocinas y más con garantía de calidad.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWhatsAppClick}
                  className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <WhatsAppIcon className="h-5 w-5 mr-3" />
                  Consulta Gratuita
                </motion.button>
                
                <Link href="/obras#proyectos">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
                  >
                    Ver Obras
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl" />
      </section>

      {/* Sección de Estadísticas - Social Proof */}
      <section className="py-16 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Users className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">500+</h3>
              <p className="text-gray-600">Clientes Satisfechos</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Award className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">15+</h3>
              <p className="text-gray-600">Años de Experiencia</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Star className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">1000+</h3>
              <p className="text-gray-600">Proyectos Completados</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Tag className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">50+</h3>
              <p className="text-gray-600">Tipos de Madera</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sección de Servicios - Destacando Beneficios */}
      <section id="servicios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className={cn([satoshi.className, "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6"])}>
              Nuestros Servicios Especializados
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto">
              Ofrecemos soluciones completas en carpintería con los más altos estándares de calidad
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-amber-200 h-full">
                  <div className={`w-16 h-16 ${service.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon className={`h-8 w-8 ${service.color}`} />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-4 group-hover:text-amber-600 transition-colors">
                    {service.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section id="proyectos" className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap justify-center gap-4"
          >
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className="px-6 py-2 rounded-full capitalize hover:scale-105 transition-transform"
              >
                {category === 'all' ? 'Todos' : category}
              </Button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Projects Grid - Estilo Obras del Inicio */}
      <section className="py-16 bg-white" id="proyectos">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center py-20"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No hay obras disponibles
              </h3>
              <p className="text-gray-600">
                No se encontraron obras para la categoría seleccionada.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredProjects.map((project, index) => (
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
          )}
        </div>
      </section>

      {/* Sección de Testimonios - Social Proof */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className={cn([satoshi.className, "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6"])}>
              Lo Que Dicen Nuestros Clientes
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto">
              La satisfacción de nuestros clientes es nuestra mayor recompensa
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "María González",
                project: "Cocina Integral",
                rating: 5,
                text: "Excelente trabajo en nuestra cocina. La calidad de la madera y el acabado superaron nuestras expectativas. Muy profesionales y puntuales."
              },
              {
                name: "Carlos Rodríguez",
                project: "Deck Exterior",
                rating: 5,
                text: "El deck quedó perfecto. Resiste muy bien la intemperie y el diseño es exactamente lo que queríamos. Totalmente recomendados."
              },
              {
                name: "Ana Martínez",
                project: "Muebles a Medida",
                rating: 5,
                text: "Los muebles que nos hicieron son una obra de arte. La atención al detalle y el acabado son impecables. Definitivamente volveremos a trabajar con ellos."
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 leading-relaxed mb-6 italic">
                  &quot;{testimonial.text}&quot;
                </p>
                
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-amber-600">{testimonial.project}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Testimonios */}
      {/* Sección de Testimonials - OCULTA */}
      {/* <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className={cn([satoshi.className, "text-4xl lg:text-5xl font-bold text-gray-900 mb-6"])}>
              Lo Que Dicen Nuestros Clientes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              La satisfacción de nuestros clientes es nuestra mayor recompensa
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "María González",
                project: "Cocina Integral",
                testimonial: "Excelente trabajo y atención. La cocina quedó exactamente como la soñé. Muy recomendables.",
                rating: 5
              },
              {
                name: "Carlos Rodríguez",
                project: "Deck Exterior",
                testimonial: "Profesionales de primera. El deck resistió perfectamente el clima y se ve increíble.",
                rating: 5
              },
              {
                name: "Ana Martínez",
                project: "Muebles a Medida",
                testimonial: "Calidad excepcional y precio justo. Definitivamente volveré a trabajar con ellos.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-gray-50 rounded-2xl p-6 text-center"
              >
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.testimonial}"</p>
                <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                <p className="text-sm text-gray-500">{testimonial.project}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Principal - Conversión */}
      <section className="py-20 bg-gradient-to-r from-amber-500 to-orange-600 text-white relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={cn([satoshi.className, "text-3xl sm:text-4xl md:text-5xl font-bold mb-6"])}>
              ¿Listo para tu Próximo Proyecto?
            </h2>
            
            <p className="text-lg sm:text-xl text-amber-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Obtén una cotización gratuita y descubre cómo podemos transformar 
              tus ideas en realidad con la mejor calidad de madera.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWhatsAppClick}
                className="px-8 py-4 bg-white text-amber-600 font-bold rounded-xl hover:bg-amber-50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center min-w-[200px]"
              >
                <WhatsAppIcon className="h-5 w-5 mr-3" />
                Cotización Gratuita
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Crear enlace temporal para descargar PDF
                  const link = document.createElement('a');
                  link.href = '/catalogo-maderas-caballero.pdf'; // Ruta del PDF
                  link.download = 'Catalogo-Maderas-Caballero.pdf';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-amber-600 transition-all duration-300 min-w-[200px] flex items-center justify-center"
              >
                <Download className="h-5 w-5 mr-3" />
                Descargar Catálogo
              </motion.button>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-8 text-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span>Sin compromiso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span>Respuesta en 24hs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span>Garantía incluida</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sección de Contacto */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className={cn([satoshi.className, "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-6"])}>
              Contáctanos
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Estamos listos para hacer realidad tu próximo proyecto en madera
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Información de Contacto */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-6">Información de Contacto</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-500 p-3 rounded-xl">
                      <WhatsAppIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">WhatsApp</p>
                      <a href="https://wa.me/541121781148" className="text-white hover:text-green-400 transition-colors">
                        +54 11 2178-1148
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-500 p-3 rounded-xl">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Teléfono</p>
                      <a href="tel:01121781148" className="text-white hover:text-blue-400 transition-colors">
                        011 2178-1148
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-500 p-3 rounded-xl">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <a href="mailto:info@maderascaballero.com" className="text-white hover:text-purple-400 transition-colors">
                        info@maderascaballero.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="bg-orange-500 p-3 rounded-xl">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Dirección</p>
                      <p className="text-white">
                        Av. Dr. Honorio Pueyrredón 4625<br />
                        Villa Rosa, Buenos Aires
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-500 p-3 rounded-xl">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Horarios</p>
                      <p className="text-white">
                        Lunes - Viernes: 8:00 - 18:00<br />
                        Sábados: 8:00 - 13:00<br />
                        Domingos: Cerrado
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Redes Sociales */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-6">Síguenos en Redes</h3>
                <div className="grid grid-cols-3 gap-4">
                  <a href="#" className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-center transition-all duration-300 hover:scale-105 group">
                    <div className="flex justify-center mb-2">
                      <Facebook className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    </div>
                    <p className="text-xs text-gray-300">Facebook</p>
                  </a>
                  <a href="#" className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-center transition-all duration-300 hover:scale-105 group">
                    <div className="flex justify-center mb-2">
                      <Instagram className="h-6 w-6 text-pink-400 group-hover:text-pink-300 transition-colors" />
                    </div>
                    <p className="text-xs text-gray-300">Instagram</p>
                  </a>
                  <a href="https://www.tiktok.com/@maderascaballero2" target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-center transition-all duration-300 hover:scale-105 group">
                    <div className="flex justify-center mb-2">
                      <TikTokIcon className="h-6 w-6 text-pink-400 group-hover:text-pink-300 transition-colors" />
                    </div>
                    <p className="text-xs text-gray-300">TikTok</p>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Formulario de Contacto */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
            >
              <h3 className="text-lg font-semibold mb-6">Envíanos un Mensaje</h3>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-400 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
                        placeholder="Tu nombre"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-400 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
                        placeholder="Tu teléfono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-400 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mensaje" className="block text-sm font-medium text-gray-300 mb-2">
                    Mensaje *
                  </label>
                  <div className="relative">
                    <div className="absolute top-4 left-4 pointer-events-none">
                      <MessageCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      rows={5}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-400 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all resize-none"
                      placeholder="Cuéntanos sobre tu proyecto..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>Enviar Mensaje</span>
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectsListPage;
