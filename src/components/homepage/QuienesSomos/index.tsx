import React from "react";
import * as motion from "framer-motion/client";
import { satoshi } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { CheckCircle2, Leaf, Layers, MapPin, TreePine } from "lucide-react";

const QuienesSomos = () => {
  const pilares = [
    {
      icon: <Leaf className="w-8 h-8 md:w-9 md:h-9 text-[rgb(var(--brand-600))]" />,
      title: "Soluciones que inspiran",
      description: "Materiales para transformar interior y exterior.",
    },
    {
      icon: <TreePine className="w-8 h-8 md:w-9 md:h-9 text-[rgb(var(--brand-600))]" />,
      title: "Variedad de categorías",
      description: "Decks, wall panels, placas, revestimientos y más.",
    },
    {
      icon: <Layers className="w-8 h-8 md:w-9 md:h-9 text-[rgb(var(--brand-600))]" />,
      title: "Calidad y terminación",
      description: "Opciones pensadas para durar y verse bien.",
    },
    {
      icon: <MapPin className="w-8 h-8 md:w-9 md:h-9 text-[rgb(var(--brand-600))]" />,
      title: "Buenos Aires",
      description: "Distribución y soporte local.",
    },
  ];

  return (
    <div className="">
      <section id="nosotros" className="max-w-frame mx-auto p-5 sm:p-6 md:p-8 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center mt-4 mb-7 md:mb-10">
          <motion.h2
            initial={{ y: "24px", opacity: 0 }}
            whileInView={{ y: "0px", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={cn([
              satoshi.className,
              "text-xl sm:text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-[1.1] md:leading-[1.05]",
            ])}
          >
            <span className="block">Nativa Revestimientos:</span>
            <span className="block">materiales para tu proyecto</span>
          </motion.h2>
          <p className="text-sm sm:text-base md:text-xl text-gray-700 max-w-3xl mx-auto mt-2.5 md:mt-3">
            Decks macizas, wall panels (WPC/PVC/EPS y madera nativa), revestimientos, placas PVC/símil madera y piedra flex. Te acompañamos con
            asesoramiento experto para elegir la mejor opción, cotizar y ejecutar con foco en la calidad y durabilidad.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-4 sm:gap-y-6 gap-x-3 sm:gap-x-4 mb-5 md:mb-7"
        >
          {pilares.map((pilar, index) => (
            <div
              key={pilar.title}
              className={cn(
                "text-center px-3 py-3 sm:py-0 rounded-xl sm:rounded-none bg-[rgb(var(--brand-600)/0.04)] sm:bg-transparent",
                index < pilares.length - 1 ? "lg:border-r lg:border-[rgb(var(--brand-600)/0.20)] lg:px-5" : "",
              )}
            >
              <div className="inline-flex items-center justify-center mb-2">{pilar.icon}</div>
              <h4 className="text-sm sm:text-base md:text-lg font-bold uppercase text-gray-900 leading-tight">{pilar.title}</h4>
              <p className="text-xs sm:text-sm md:text-base text-gray-700 mt-1 leading-snug">{pilar.description}</p>
            </div>
          ))}
        </motion.div>

        <p className="text-center text-sm sm:text-base md:text-xl font-medium leading-snug text-gray-900 max-w-2xl mx-auto mb-4 md:mb-8 mt-4 md:mt-8">
          Calidad, asesoramiento y servicio para tu proyecto.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 md:gap-5 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden min-h-[180px] sm:min-h-[210px] md:min-h-[250px]"
          >
            <Image
              src="/images/home/about/nosotros.jpg"
              alt="Interior en madera natural"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 md:p-6"
          >
            <h3 className="text-xl md:text-2xl font-semibold text-gray-900">Nuestro Equipo</h3>
            <p className="text-sm md:text-base text-gray-700 mt-2">
              Profesionales en soluciones para decks, wall panels, placas, piedra flex y revestimientos.
            </p>
            <div className="mt-4 md:mt-5 space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm md:text-base text-gray-900">
                <CheckCircle2 className="w-5 h-5 text-[rgb(var(--brand-600))]" />
                <span>Materiales seleccionados</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm md:text-base text-gray-900">
                <CheckCircle2 className="w-5 h-5 text-[rgb(var(--brand-600))]" />
                <span>Asesoramiento experto</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm md:text-base text-gray-900">
                <CheckCircle2 className="w-5 h-5 text-[rgb(var(--brand-600))]" />
                <span>Proyectos a medida</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default QuienesSomos;
