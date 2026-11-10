"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type PaymentMethod = "mercadopago" | "transferencia" | "nave_galicia";

type PaymentMethodContextValue = {
  paymentMethod: PaymentMethod | null;
  setPaymentMethod: (method: PaymentMethod) => void;
  clearPaymentMethod: () => void;
};

const PaymentMethodContext = createContext<PaymentMethodContextValue | null>(null);

export function PaymentMethodProvider({ children }: { children: React.ReactNode }) {
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod | null>(null);

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setPaymentMethodState(method);
  }, []);

  const clearPaymentMethod = useCallback(() => {
    setPaymentMethodState(null);
  }, []);

  const value = useMemo(
    () => ({ paymentMethod, setPaymentMethod, clearPaymentMethod }),
    [paymentMethod, setPaymentMethod, clearPaymentMethod]
  );

  return <PaymentMethodContext.Provider value={value}>{children}</PaymentMethodContext.Provider>;
}

export function usePaymentMethod() {
  const ctx = useContext(PaymentMethodContext);
  if (!ctx) {
    throw new Error("usePaymentMethod must be used within PaymentMethodProvider");
  }
  return ctx;
}
