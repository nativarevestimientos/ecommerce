import React from "react";
import * as motion from "framer-motion/client";
import { satoshi } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const AtencionPersonalizada = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = "541121781148";
    const message = "Hola! Necesito atención personalizada para Arquitectos, Diseñadores e Instaladores.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="">
      <section className="max-w-frame mx-auto rounded-2xl md:rounded-3xl overflow-hidden border border-[rgb(var(--brand-600)/0.18)] shadow-sm bg-gradient-to-r from-[rgb(var(--brand-900))] via-[rgb(var(--brand-700))] to-[rgb(var(--brand-500))]">
        <div className="px-4 sm:px-6 md:px-10 py-8 md:py-10">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold tracking-wide uppercase bg-white/15 text-white border border-white/20 mb-3 md:mb-4">
              Asesoramiento profesional
            </span>
          <motion.h2
            initial={{ y: "24px", opacity: 0 }}
            whileInView={{ y: "0px", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={cn([satoshi.className, "text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-tight"])}
          >
            Atención Personalizada para: <br /> Arquitectos, Diseñadores e Instaladores
          </motion.h2>
            <p className="text-sm sm:text-base md:text-lg text-white/85 leading-relaxed mt-3 sm:mt-4 mb-6 md:mb-7 max-w-3xl mx-auto">
              Nuestro equipo comercial y técnico te acompaña en cada etapa para que tomes decisiones seguras y eficientes.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWhatsAppClick}
                className="inline-flex items-center justify-center gap-2.5 px-5 md:px-6 py-3 md:py-3.5 bg-white text-[rgb(var(--brand-900))] text-sm md:text-base font-semibold rounded-xl hover:bg-[rgb(var(--brand-50))] transition-all duration-300 shadow-lg shadow-black/20"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
                Hablar con un asesor
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AtencionPersonalizada;
