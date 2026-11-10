import React from "react";

const ProyectosDestacadosSkeleton = () => {
  return (
    <section className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header Skeleton */}
        <div className="text-center mb-16">
          <div className="h-12 lg:h-16 bg-gray-200 rounded-lg mx-auto mb-8 max-w-md animate-pulse" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded mx-auto max-w-2xl animate-pulse" />
            <div className="h-6 bg-gray-200 rounded mx-auto max-w-xl animate-pulse" />
          </div>
        </div>

        {/* Projects Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Image Skeleton */}
              <div className="h-64 bg-gray-200 animate-pulse" />

              {/* Content Skeleton */}
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                <div className="h-12 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section Skeleton */}
        <div className="bg-gray-200 rounded-3xl p-12 lg:p-16 animate-pulse">
          <div className="text-center space-y-6">
            <div className="h-10 bg-gray-300 rounded mx-auto max-w-md" />
            <div className="space-y-3">
              <div className="h-5 bg-gray-300 rounded mx-auto max-w-2xl" />
              <div className="h-5 bg-gray-300 rounded mx-auto max-w-lg" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="h-12 bg-gray-300 rounded w-48" />
              <div className="h-12 bg-gray-300 rounded w-48" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProyectosDestacadosSkeleton;
