import React from "react";
import { motion } from "framer-motion";
import { satoshi } from "@/styles/fonts";
import { cn } from "@/lib/utils";

const ubicaciones = [
  {
    id: 1,
    titulo: "Sucursal Principal",
    direccion: "Av. Dr. Ricardo Balbín 4504",
    ciudad: "San Miguel",
    provincia: "Buenos Aires",
    coordenadas: { lat: -34.5444, lng: -58.7122 },
    mapaUrl: "https://maps.google.com/maps?q=-34.5444,-58.7122&z=15&output=embed"
  },
  {
    id: 2,
    titulo: "Sucursal Secundaria",
    direccion: "Av. Dr. Honorio Pueyrredón 4625",
    ciudad: "Villa Rosa",
    provincia: "Buenos Aires",
    coordenadas: { lat: -34.4567, lng: -58.7890 },
    mapaUrl: "https://maps.google.com/maps?q=-34.4567,-58.7890&z=15&output=embed"
  }
];

const Ubicacion = () => {
  return (
    <div className="px-4 xl:px-0">
      <section id="ubicacion" className="max-w-frame mx-auto px-4 md:px-6 py-16 md:py-24">
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
            Donde estamos
          </motion.h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mt-4 sm:mt-6">
            Encuentra nuestras sucursales en puntos estratégicos de Buenos Aires
          </p>
        </motion.div>

        {/* Ubicaciones */}
        <div className="space-y-20 md:space-y-24">
          {ubicaciones.map((ubicacion, index) => (
            <motion.div
              key={ubicacion.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className={`flex flex-col lg:flex-row items-center gap-4 lg:gap-6 justify-around ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Texto */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full lg:w-auto space-y-4"
              >
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    {ubicacion.titulo}
                  </h3>
                  <div className="space-y-2">
                    <p className="text-lg md:text-xl font-semibold text-gray-800">
                      {ubicacion.direccion}
                    </p>
                    <p className="text-lg md:text-xl font-semibold text-gray-800">
                      {ubicacion.ciudad}, {ubicacion.provincia}
                    </p>
                  </div>
                </div>
                
                <motion.a
                  href={`https://maps.google.com/maps?q=${ubicacion.coordenadas.lat},${ubicacion.coordenadas.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <span>Ver mapa</span>
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                    />
                  </svg>
                </motion.a>
              </motion.div>

              {/* Mapa */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="w-full lg:w-auto relative"
              >
                <div className="relative w-full sm:w-80 md:w-96 lg:w-[500px] xl:w-[600px] h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg">
                  {/* Mapa */}
                  <iframe
                    src={ubicacion.mapaUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  
                  {/* Degradado solo en el lado donde se conecta con el texto */}
                  {index % 2 === 0 ? (
                    // Primera ubicación: degradado en el lado izquierdo (donde se conecta con el texto)
                    <div className="absolute top-0 bottom-0 left-0 w-8 sm:w-12 lg:w-16 bg-gradient-to-r from-white via-white/80 to-transparent" />
                  ) : (
                    // Segunda ubicación: degradado en el lado derecho (donde se conecta con el texto)
                    <div className="absolute top-0 bottom-0 right-0 w-8 sm:w-12 lg:w-16 bg-gradient-to-l from-white via-white/80 to-transparent" />
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Ubicacion;
