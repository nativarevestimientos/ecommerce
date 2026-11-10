import { motion } from "framer-motion";

interface AnimatedSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const AnimatedSpinner = ({
  size = "md",
  color = "blue",
  className = "",
}: AnimatedSpinnerProps) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const colors = {
    blue: "text-blue-600",
    red: "text-red-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    gray: "text-gray-600",
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
        className={`${sizes[size]} ${colors[color as keyof typeof colors]}`}
      >
        <svg
          className="animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default AnimatedSpinner; 