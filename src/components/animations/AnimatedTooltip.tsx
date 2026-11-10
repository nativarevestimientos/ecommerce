import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState } from "react";

interface AnimatedTooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "right" | "bottom" | "left";
  className?: string;
}

const AnimatedTooltip = ({
  content,
  children,
  position = "top",
  className = "",
}: AnimatedTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  };

  const arrows = {
    top: "bottom-[-6px] left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent",
    right: "left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-l-gray-800 border-r-transparent border-b-transparent",
    bottom: "top-[-6px] left-1/2 -translate-x-1/2 border-t-transparent border-l-transparent border-r-transparent border-b-gray-800",
    left: "right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-l-transparent border-r-gray-800 border-b-transparent",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`absolute z-50 ${positions[position]} ${className}`}
          >
            <div className="bg-gray-800 text-white text-sm py-1 px-2 rounded shadow-lg whitespace-nowrap">
              {content}
              <div
                className={`absolute w-0 h-0 border-4 ${arrows[position]}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedTooltip; 