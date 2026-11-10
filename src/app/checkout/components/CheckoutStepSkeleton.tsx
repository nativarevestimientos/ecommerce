import React from "react";
import { cn } from "@/lib/utils";
import { satoshi } from "@/styles/fonts";

interface CheckoutStepSkeletonProps {
  step: number;
}

const SkeletonBlock = ({ className }: { className: string }) => {
  return (
    <div
      className={cn([
        "relative overflow-hidden rounded-xl bg-[rgb(var(--brand-100))] border border-[rgb(var(--brand-200))]",
        className,
      ])}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[rgb(var(--surface))]/70 to-transparent" />
    </div>
  );
};

const CheckoutStepSkeleton: React.FC<CheckoutStepSkeletonProps> = ({ step }) => {
  return (
    <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--brand-200))] p-6">
      <h2
        className={cn([
          satoshi.className,
          "text-3xl font-bold text-center mb-6 text-[rgb(var(--brand-900))]",
        ])}
      >
        {step === 0 && "Información Personal"}
        {step === 1 && "Dirección de Envío"}
        {step === 2 && "Método de Pago"}
      </h2>
      
      <div className="space-y-4">
        {step === 0 && (
          <>
            <div className="space-y-3">
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
            </div>
            
            <div className="flex justify-end mt-4">
              <SkeletonBlock className="h-11 w-32 rounded-full" />
            </div>
          </>
        )}
        
        {step === 1 && (
          <>
            <div className="space-y-3">
              <SkeletonBlock className="h-12" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
              </div>
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
            </div>
            
            <div className="flex justify-between mt-4">
              <SkeletonBlock className="h-11 w-32 rounded-full" />
              <SkeletonBlock className="h-11 w-32 rounded-full" />
            </div>
          </>
        )}
        
        {step === 2 && (
          <>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SkeletonBlock className="h-16" />
                <SkeletonBlock className="h-16" />
              </div>
              <SkeletonBlock className="h-24" />
              <SkeletonBlock className="h-16" />
            </div>
            
            <div className="flex justify-between mt-4">
              <SkeletonBlock className="h-11 w-32 rounded-full" />
              <SkeletonBlock className="h-11 w-40 rounded-full" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutStepSkeleton; 
