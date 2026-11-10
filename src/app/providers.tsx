// app/providers.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "../lib/store";
import { PersistGate } from "redux-persist/integration/react";
import SpinnerbLoader from "@/components/ui/SpinnerbLoader/index";
import { SWRConfig } from 'swr';
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'sonner'
import { useRouter } from 'next/navigation'

type Props = {
  children: React.ReactNode;
};

const Providers = ({ children }: Props) => {
  const storeRef = useRef<ReturnType<typeof makeStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  const { store, persistor } = storeRef.current;
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60000,
      }}
    >
      <AuthProvider>
        <Provider store={store}>
          <PersistGate
            loading={
              <div className="flex items-center justify-center h-96">
                <SpinnerbLoader className="w-10 border-2 border-gray-300 border-r-gray-600" />
              </div>
            }
            persistor={persistor}
          >
            {children}
            <Toaster 
              position="top-center"
              duration={3000}
              expand={false}
              richColors
              closeButton
              style={{
                top: '0.75rem',
                left: '50%',
                right: 'auto',
                transform: 'translateX(-50%)',
                width: 'calc(100vw - 2rem)',
                maxWidth: '320px',
              }}
            />
          </PersistGate>
        </Provider>
      </AuthProvider>
    </SWRConfig>
  );
};

export default Providers;
