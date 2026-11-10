import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  show?: boolean;
}

const FadeIn = ({
  children,
  className = "",
  delay = 0,
  duration = 0.3,
  show = true,
}: FadeInProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration,
            delay,
            ease: "easeOut",
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FadeIn; 