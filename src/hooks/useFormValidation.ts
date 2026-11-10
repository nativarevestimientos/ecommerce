import { useState, useEffect } from "react";

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
}

interface ValidationMessages {
  required?: string;
  minLength?: string;
  maxLength?: string;
  pattern?: string;
  custom?: string;
}

interface FieldValidation {
  value: string;
  rules: ValidationRules;
  messages: ValidationMessages;
}

interface ValidationResult {
  isValid: boolean;
  message: string | null;
}

export const useFormValidation = () => {
  const [fields, setFields] = useState<Record<string, FieldValidation>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const validateField = (
    name: string,
    value: string,
    rules: ValidationRules,
    messages: ValidationMessages
  ): ValidationResult => {
    if (rules.required && !value) {
      return {
        isValid: false,
        message: messages.required || "Este campo es requerido",
      };
    }

    if (rules.minLength && value.length < rules.minLength) {
      return {
        isValid: false,
        message:
          messages.minLength ||
          `Mínimo ${rules.minLength} caracteres requeridos`,
      };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return {
        isValid: false,
        message:
          messages.maxLength ||
          `Máximo ${rules.maxLength} caracteres permitidos`,
      };
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return {
        isValid: false,
        message: messages.pattern || "Formato inválido",
      };
    }

    if (rules.custom && !rules.custom(value)) {
      return {
        isValid: false,
        message: messages.custom || "Valor inválido",
      };
    }

    return { isValid: true, message: null };
  };

  const registerField = (
    name: string,
    rules: ValidationRules,
    messages: ValidationMessages
  ) => {
    setFields((prev) => ({
      ...prev,
      [name]: {
        value: "",
        rules,
        messages,
      },
    }));
  };

  const updateField = (name: string, value: string) => {
    setFields((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
      },
    }));
  };

  useEffect(() => {
    const newErrors: Record<string, string | null> = {};
    let formIsValid = true;

    Object.entries(fields).forEach(([name, field]) => {
      const { value, rules, messages } = field;
      const validation = validateField(name, value, rules, messages);
      newErrors[name] = validation.message;
      if (!validation.isValid) {
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    setIsFormValid(formIsValid);
  }, [fields]);

  return {
    registerField,
    updateField,
    errors,
    isFormValid,
  };
}; 