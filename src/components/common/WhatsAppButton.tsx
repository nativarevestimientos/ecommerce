import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WhatsAppButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    // Número de WhatsApp (puedes cambiarlo)
    const phoneNumber = "541121781148";
    const message = "Hola! Me gustaría obtener más información sobre sus productos.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Reset del estado después de un delay
    setTimeout(() => setIsClicked(false), 200);
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ opacity: 0, scale: 0, x: -100 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: 1,
        type: "spring",
        stiffness: 200
      }}
    >
      {/* Botón principal */}
      <motion.button
        className="relative group"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={isClicked ? { rotate: [0, -10, 10, -10, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        {/* Círculo principal */}
        <motion.div
          className="w-16 h-16 bg-green-500 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden"
          animate={{
            boxShadow: isHovered 
              ? "0 20px 40px rgba(34, 197, 94, 0.4)" 
              : "0 10px 30px rgba(34, 197, 94, 0.3)"
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Efecto de brillo */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full"
            animate={{
              rotate: isHovered ? 360 : 0
            }}
            transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
          />
          
          {/* Icono de WhatsApp */}
          <motion.div
            className="relative z-10 text-white"
            animate={{
              scale: isHovered ? 1.2 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            <svg 
              className="w-8 h-8" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
          </motion.div>
        </motion.div>

        {/* Pulsos animados */}
        <AnimatePresence>
          {isHovered && (
            <>
              <motion.div
                className="absolute inset-0 w-16 h-16 bg-green-400 rounded-full"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 w-16 h-16 bg-green-400 rounded-full"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
};

export default WhatsAppButton;
