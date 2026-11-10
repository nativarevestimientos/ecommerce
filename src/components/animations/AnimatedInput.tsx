import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface AnimatedInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: string) => boolean;
  };
}

const AnimatedInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  validation,
}: AnimatedInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (validation) {
      let valid = true;
      
      if (validation.pattern && !validation.pattern.test(value)) {
        valid = false;
      }
      
      if (validation.minLength && value.length < validation.minLength) {
        valid = false;
      }
      
      if (validation.maxLength && value.length > validation.maxLength) {
        valid = false;
      }
      
      if (validation.custom && !validation.custom(value)) {
        valid = false;
      }
      
      setIsValid(valid);
    }
  }, [value, validation]);

  return (
    <div className={`relative ${className}`}>
      <motion.label
        htmlFor={name}
        className={`absolute left-3 text-sm transition-colors ${
          isFocused || value
            ? "text-blue-600 -top-2 bg-white px-1"
            : "text-gray-500 top-3"
        }`}
        initial={false}
        animate={{
          y: isFocused || value ? -20 : 0,
          scale: isFocused || value ? 0.85 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </motion.label>

      <motion.input
        id={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md outline-none transition-colors ${
          isFocused
            ? "border-blue-500 ring-1 ring-blue-500"
            : error
            ? "border-red-500"
            : "border-gray-300"
        } ${
          disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white hover:border-gray-400"
        }`}
        initial={false}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      />

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-1 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!error && value && isValid && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <svg
              className="h-5 w-5 text-green-500"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedInput; 