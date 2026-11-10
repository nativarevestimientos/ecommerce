"use client";

import { createContext, useContext } from "react";
import { ToastProvider as RadixToastProvider } from "@radix-ui/react-toast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <RadixToastProvider>{children}</RadixToastProvider>;
}

export const ToastContext = createContext<{} | null>(null);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
} 