import React from "react";
import Link from "next/link";
import Image from "next/image";

interface DestacadoCardProps {
  categoria: string;
  titulo: string;
  subtitulo?: string;
  descripcion?: string;
  boton?: string;
  imagen: string;
  url: string;
  tipo: "horizontal" | "vertical";
  colorBoton?: "dark" | "light";
  mostrarBoton?: boolean;
  esOferta?: boolean;
}

const DestacadoCard = ({
  categoria,
  titulo,
  subtitulo,
  descripcion,
  boton,
  imagen,
  url,
  tipo,
  colorBoton = "light",
  mostrarBoton = true,
  esOferta = false
}: DestacadoCardProps) => {
  const isHorizontal = tipo === "horizontal";
  
  // Si es una tarjeta de oferta, renderizar sin enlace ni contenido
  if (esOferta) {
    return (
      <div className={`relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${
        isHorizontal ? "lg:col-span-2" : ""
      }`}>
        <div className={`relative ${
          isHorizontal ? "h-64 md:h-80" : "h-80"
        }`}>
          <Image
            src={imagen}
            alt={titulo}
            fill
            className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      </div>
    );
  }
  
  // Tarjeta normal con contenido
  return (
    <Link href={url} className="block group">
      <div className={`relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${
        isHorizontal ? "lg:col-span-2" : ""
      }`}>
        
        {/* Imagen de fondo */}
        <div className={`relative ${
          isHorizontal ? "h-64 md:h-80" : "h-80"
        }`}>
          <Image
            src={imagen}
            alt={titulo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Overlay sutil y moderno */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          
          {/* Contenido superpuesto con diseño minimalista */}
          <div className={`absolute inset-0 p-6 md:p-8 flex flex-col justify-end ${
            isHorizontal ? "md:justify-center md:items-start" : ""
          }`}>
            
            {/* Contenido oculto */}
            {/* <p className="text-[11px] font-medium text-white/70 uppercase tracking-[0.2em] mb-3">
              {categoria}
            </p>
            
            <h3 className="text-xl md:text-2xl lg:text-3xl font-light text-white mb-2 leading-tight">
              {titulo}
            </h3>
            
            {subtitulo && (
              <p className="text-sm md:text-base text-white/80 mb-4 font-light">
                {subtitulo}
              </p>
            )}
            
            {descripcion && (
              <p className="text-sm text-white/70 leading-relaxed mb-6 max-w-md font-light">
                {descripcion}
              </p>
            )}
            
            {mostrarBoton && boton && (
              <div className="mt-2">
                <span className={`inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  colorBoton === "dark"
                    ? "bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:border-white/30"
                    : "bg-white/90 backdrop-blur-sm text-gray-900 border border-white/30 hover:bg-white hover:border-white/50"
                }`}>
                  {boton}
                </span>
              </div>
            )} */}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DestacadoCard;
