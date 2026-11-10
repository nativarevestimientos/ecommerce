import React from "react";

const DestacadosSkeleton = () => {
  return (
    <div className="px-4 xl:px-0">
      <section className="max-w-frame mx-auto py-6 md:py-8">
        {/* Título skeleton */}
        <div className="mb-8 text-center">
          <div className="w-48 h-10 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="w-80 h-4 bg-gray-200 rounded mx-auto"></div>
        </div>

        {/* Grid de tarjetas skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Tarjeta horizontal skeleton */}
          <div className="lg:col-span-2 bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="flex flex-col md:flex-row h-full">
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                <div className="w-32 h-3 bg-gray-200 rounded mb-2"></div>
                <div className="w-48 h-8 bg-gray-200 rounded mb-2"></div>
                <div className="w-64 h-4 bg-gray-200 rounded mb-6"></div>
                <div className="w-32 h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="md:w-1/2 h-64 bg-gray-200"></div>
            </div>
          </div>

          {/* Tarjeta vertical skeleton 1 */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="flex flex-col h-full">
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                <div className="w-24 h-3 bg-gray-200 rounded mb-2"></div>
                <div className="w-32 h-8 bg-gray-200 rounded mb-2"></div>
                <div className="w-28 h-5 bg-gray-200 rounded mb-6"></div>
                <div className="w-32 h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200"></div>
            </div>
          </div>

          {/* Tarjeta vertical skeleton 2 */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="flex flex-col h-full">
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                <div className="w-28 h-3 bg-gray-200 rounded mb-2"></div>
                <div className="w-36 h-8 bg-gray-200 rounded mb-2"></div>
                <div className="w-32 h-5 bg-gray-200 rounded mb-6"></div>
                <div className="w-32 h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DestacadosSkeleton;
