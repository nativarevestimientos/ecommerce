"use client";

import { ProjectTestimonial } from '@/types/project';
import { motion } from 'framer-motion';
import { satoshi } from '@/styles/fonts';
import { cn } from '@/lib/utils';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface ProjectTestimonialsProps {
  testimonials: ProjectTestimonial[];
}

const ProjectTestimonials = ({ testimonials }: ProjectTestimonialsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn([
          "h-5 w-5",
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        ])}
      />
    ));
  };

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
          <h2 className={cn([satoshi.className, "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 uppercase tracking-wide mb-8 leading-tight"])}>
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
            La satisfacción de nuestros clientes es nuestra mejor recompensa
          </p>
        </motion.div>

        {/* Main Testimonial */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl relative">
            <Quote className="h-16 w-16 text-gray-200 absolute top-6 left-6" />
            
            <div className="relative z-10">
              <div className="flex mb-6">
                {renderStars(testimonials[currentIndex].rating)}
              </div>
              
              <blockquote className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light text-gray-800 leading-relaxed mb-6 sm:mb-8">
                &quot;{testimonials[currentIndex].content}&quot;
              </blockquote>
              
              <div className="flex items-center">
                {testimonials[currentIndex].avatar && (
                  <div className="relative w-16 h-16 mr-4">
                    <Image
                      src={testimonials[currentIndex].avatar!}
                      alt={testimonials[currentIndex].name}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                )}
                
                <div>
                  <div className="font-bold text-lg sm:text-xl text-gray-900">
                    {testimonials[currentIndex].name}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600">
                    {testimonials[currentIndex].role}
                    {testimonials[currentIndex].company && (
                      <span> - {testimonials[currentIndex].company}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Testimonial Navigation */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4"
        >
          {testimonials.map((testimonial, index) => (
            <motion.button
              key={testimonial.id}
              variants={itemVariants}
              onClick={() => setCurrentIndex(index)}
              className={cn([
                "p-4 rounded-xl transition-all duration-300 border-2",
                index === currentIndex 
                  ? "bg-black text-white border-black" 
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              ])}
            >
              <div className="flex items-center space-x-3">
                {testimonial.avatar && (
                  <div className="relative w-10 h-10">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                )}
                <div className="text-left">
                  <div className="font-semibold text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-xs opacity-75">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* All Testimonials Grid (Hidden on mobile) */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="hidden lg:grid grid-cols-3 gap-8 mt-20"
        >
          {testimonials.slice(0, 3).map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={itemVariants}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <div className="flex mb-4">
                {renderStars(testimonial.rating)}
              </div>
              
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                &quot;{testimonial.content}&quot;
              </blockquote>
              
              <div className="flex items-center">
                {testimonial.avatar && (
                  <div className="relative w-12 h-12 mr-3">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                )}
                
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectTestimonials;
