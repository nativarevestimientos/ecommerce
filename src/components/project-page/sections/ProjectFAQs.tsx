"use client";

import { ProjectFAQ } from '@/types/project';
import { motion, AnimatePresence } from 'framer-motion';
import { satoshi } from '@/styles/fonts';
import { cn } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

interface ProjectFAQsProps {
  faqs: ProjectFAQ[];
}

const ProjectFAQs = ({ faqs }: ProjectFAQsProps) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className={cn([satoshi.className, "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 uppercase tracking-wide mb-8 leading-tight"])}>
            Preguntas Frecuentes
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed">
            Resolvemos las dudas más comunes sobre nuestros servicios
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {faqs.map((faq) => {
            const isOpen = openItems.has(faq.id);
            
            return (
              <motion.div
                key={faq.id}
                variants={itemVariants}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full px-6 lg:px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    {isOpen ? (
                      <Minus className="h-6 w-6 text-gray-600" />
                    ) : (
                      <Plus className="h-6 w-6 text-gray-600" />
                    )}
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 lg:px-8 pb-6 pt-2">
                        <motion.div
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -10, opacity: 0 }}
                          transition={{ duration: 0.2, delay: 0.1 }}
                          className="text-gray-600 leading-relaxed text-sm sm:text-base lg:text-lg"
                        >
                          {faq.answer}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-16 p-8 bg-gray-50 rounded-3xl"
        >
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 text-gray-900">
            ¿Tienes más preguntas?
          </h3>
          <p className="text-base sm:text-lg text-gray-600 mb-6">
            No dudes en contactarnos. Estamos aquí para ayudarte con cualquier consulta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:01121781148"
              className="btn inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold transition-colors duration-200"
            >
              Llamar Ahora
            </a>
            <a
              href="https://wa.me/541121781148"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors duration-200"
            >
              WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectFAQs;
