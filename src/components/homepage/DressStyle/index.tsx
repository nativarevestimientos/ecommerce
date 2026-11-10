import { cn } from "@/lib/utils";
import { satoshi } from "@/styles/fonts";
import React from "react";
import * as motion from "framer-motion/client";
import DressStyleCard from "./DressStyleCard";

const categorias = [
  {
    titulo: "Tablas",
    subtitulo: "Tabla Deck WPC - Macizas 100%",
    url: "/shop?category=Decks",
    imagen: "/images/home/categories-grid/01-tablas.png",
  },
  {
    titulo: "Wall panel",
    subtitulo: "wpc - pvc - eps",
    url: "/shop?category=Wall+Panels",
    imagen: "/images/home/categories-grid/02-wall-panels.png",
  },
  {
    titulo: "Wall panel",
    subtitulo: "Madera nativa",
    url: "/shop?category=wall-panel-madera-nativa",
    imagen: "/images/home/categories-grid/03-madera-nativa.png",
  },
  {
    titulo: "Placas",
    subtitulo: "PVC",
    url: "/shop?category=Placas",
    imagen: "/images/home/categories-grid/04-placas.png",
  },
  {
    titulo: "Piedra",
    subtitulo: "Flex",
    url: "/shop?category=Piedra+Flex",
    imagen: "/images/home/categories-grid/05-piedra-flex.png",
  },
   {
    titulo: "Terminaciones",
    subtitulo: "Accesorios",
    url: "/shop?category=Accesorios",
    imagen: "/images/home/categories-grid/06-accesorios.jpg",
  },
];

const DressStyle = () => {
  return (
    <div className="">
      <section className="max-w-frame mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4"
        >
          {categorias.map((categoria) => (
            <motion.div 
              key={categoria.subtitulo} 
              whileHover={{ scale: 1.02 }} 
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
            >
              <DressStyleCard
                titulo={categoria.titulo}
                subtitulo={categoria.subtitulo}
                url={categoria.url}
                imagen={categoria.imagen}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
};

export default DressStyle;
