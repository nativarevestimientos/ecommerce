import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import Image from "next/image";

type DressStyleCardProps = {
  titulo: string;
  subtitulo: string;
  url: string;
  imagen: string;
};

const DressStyleCard = ({ titulo, subtitulo, url, imagen }: DressStyleCardProps) => {
  return (
    <Link href={url} className="group block">
      <div className="relative w-full h-48 sm:h-52 md:h-56 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer">
        {/* Contenedor interno para la transformación */}
        <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.02]">
          {/* Imagen de fondo */}
          <div className="absolute inset-0">
            <Image
              src={imagen}
              alt={titulo}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          
          {/* Overlay sutil para mejorar legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/30 z-5"></div>
          
                  {/* Badge de categoría */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
          <span className="inline-block px-2 py-1 sm:px-3 sm:py-1.5 bg-white/95 backdrop-blur-md text-[13px] sm:text-sm font-semibold text-gray-800 rounded-full border-0 shadow-lg">
            {titulo}
          </span>
        </div>
        
        {/* Subtítulo centrado */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-wide drop-shadow-2xl px-2 text-center">
            {subtitulo}
          </p>
        </div>
        
        {/* Indicador de acción sutil */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                          <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-gray-700 w-4 h-4 sm:w-5 sm:h-5"
            >
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DressStyleCard;
