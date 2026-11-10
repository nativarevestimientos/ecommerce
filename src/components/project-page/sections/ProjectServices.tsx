"use client";

import { ProjectService } from '@/types/project';
import { motion } from 'framer-motion';
import { satoshi } from '@/styles/fonts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  type CarouselApi 
} from '@/components/ui/carousel';
import { useState, useEffect, useCallback, useRef } from 'react';

interface ProjectServicesProps {
  services: ProjectService[];
}

const ProjectServices = ({ services }: ProjectServicesProps) => {
  const [carouselApis, setCarouselApis] = useState<Map<string, CarouselApi>>(new Map());
  const [carouselIndexes, setCarouselIndexes] = useState<Map<string, number>>(new Map());
  const [, setCarouselUpdates] = useState(0); // Para forzar re-render de indicadores
  const registeredApisRef = useRef<Set<string>>(new Set());

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
      transition: { duration: 0.8 }
    }
  };

  const setCarouselApi = useCallback((serviceId: string, api: CarouselApi) => {
    if (!api) return;
    
    setCarouselApis(prev => {
      // Solo actualizar si el API realmente cambió
      const existingApi = prev.get(serviceId);
      if (existingApi === api) {
        return prev; // No hacer cambios si es el mismo API
      }
      
      const newMap = new Map(prev);
      newMap.set(serviceId, api);
      return newMap;
    });
  }, []);

  // Efecto para actualizar indicadores e índices cuando cambia el carrusel
  useEffect(() => {
    const handlers: Array<{ api: NonNullable<CarouselApi>, handler: () => void, serviceId: string }> = [];
    const registeredApis = registeredApisRef.current;
    
    // Limpiar referencias de servicios que ya no existen
    const currentServiceIds = new Set(services.map(s => s.id));
    registeredApis.forEach(serviceId => {
      if (!currentServiceIds.has(serviceId)) {
        registeredApis.delete(serviceId);
      }
    });
    
    carouselApis.forEach((api, serviceId) => {
      if (api && !registeredApis.has(serviceId)) {
        const onSelect = () => {
          const selectedIndex = api.selectedScrollSnap();
          setCarouselIndexes(prev => {
            const newMap = new Map(prev);
            newMap.set(serviceId, selectedIndex);
            return newMap;
          });
          setCarouselUpdates(prev => prev + 1);
        };
        
        handlers.push({ api, handler: onSelect, serviceId });
        api.on('select', onSelect);
        registeredApis.add(serviceId);
        
        // Inicializar índice solo una vez
        const initialIndex = api.selectedScrollSnap();
        setCarouselIndexes(prev => {
          const newMap = new Map(prev);
          newMap.set(serviceId, initialIndex);
          return newMap;
        });
      }
    });

    return () => {
      handlers.forEach(({ api, handler, serviceId }) => {
        api.off('select', handler);
        registeredApis.delete(serviceId);
      });
    };
  }, [carouselApis, services]);

  return (
    <section className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className={cn([satoshi.className, "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 uppercase tracking-wide mb-8 leading-tight"])}>
            Nuestros Servicios
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
            Ofrecemos una amplia gama de servicios especializados en carpintería y construcción
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-16"
        >
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              variants={itemVariants}
              className={cn([
                "grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center",
                index % 2 === 1 && "lg:grid-flow-col-dense"
              ])}
            >
              {/* Image or Carousel */}
              <div className={cn([
                "relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl",
                index % 2 === 1 && "lg:col-start-2"
              ])}>
                {service.carousel && service.carousel.length > 0 ? (
                  <div className="relative w-full h-full">
                    <Carousel
                      setApi={(api) => api && setCarouselApi(service.id, api)}
                      opts={{
                        align: "center",
                        loop: true,
                        skipSnaps: false,
                      }}
                      className="w-full h-full"
                    >
                      <CarouselContent className="h-[400px] lg:h-[500px] -ml-0">
                        {service.carousel.map((item, itemIdx) => (
                            <CarouselItem key={item.id} className="h-[400px] lg:h-[500px] pl-0 basis-full">
                              <div className="relative h-full w-full">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  className="object-cover"
                                  priority={itemIdx === 0}
                                />
                                {/* Overlay con título y descripción */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10" />
                                <div className="absolute bottom-0 left-0 right-0 pb-20 lg:pb-24 p-6 lg:p-8 text-white z-20 pointer-events-none">
                                  <h4 className="text-base sm:text-lg lg:text-xl font-bold mb-2 drop-shadow-lg">
                                    {item.title}
                                  </h4>
                                  <p className="text-xs sm:text-sm lg:text-base text-white/95 drop-shadow-md">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </CarouselItem>
                        ))}
                      </CarouselContent>
                      
                      {/* Controles del carrusel */}
                      <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none z-30">
                        <CarouselPrevious 
                          className="pointer-events-auto static translate-x-0 translate-y-0 bg-white/90 hover:bg-white border-0 h-10 w-10 lg:h-12 lg:w-12 shadow-lg"
                        >
                          <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
                        </CarouselPrevious>
                        <CarouselNext 
                          className="pointer-events-auto static translate-x-0 translate-y-0 bg-white/90 hover:bg-white border-0 h-10 w-10 lg:h-12 lg:w-12 shadow-lg"
                        >
                          <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
                        </CarouselNext>
                      </div>

                      {/* Indicadores de puntos */}
                      <div className="absolute bottom-4 lg:bottom-6 left-0 right-0 flex justify-center gap-2 z-30">
                        {service.carousel.map((_, idx) => {
                          const api = carouselApis.get(service.id);
                          const isActive = api?.selectedScrollSnap() === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => api?.scrollTo(idx)}
                              className={cn([
                                "h-2 rounded-full transition-all duration-300 pointer-events-auto",
                                isActive ? "w-8 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
                              ])}
                              aria-label={`Ir a imagen ${idx + 1}`}
                            />
                          );
                        })}
                      </div>
                    </Carousel>
                  </div>
                ) : (
                  <>
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </>
                )}
              </div>

              {/* Content */}
              <div className={cn([
                "space-y-8",
                index % 2 === 1 && "lg:col-start-1 lg:row-start-1"
              ])}>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">
                    {service.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  {service.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: featureIndex * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm md:text-base text-gray-700">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="pt-6 mt-6 border-t border-gray-200">
                  <Link href="/contact">
                    <Button className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm md:text-base group">
                      Solicitar Cotización
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectServices;
