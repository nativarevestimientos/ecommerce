import React from "react";
import { Search, Ruler, DollarSign } from "lucide-react";
import { satoshi } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";

const steps = [
  {
    id: 1,
    title: "Buscá y elegí",
    desc: "Elegí entre nuestra selección de productos y acabados.",
    icon: <Search className="w-8 h-8 md:w-9 md:h-9" />,
  },
  {
    id: 2,
    title: "Ingresá medidas",
    desc: "Proporcioná medidas precisas para una estimación realista.",
    icon: <Ruler className="w-8 h-8 md:w-9 md:h-9" />,
  },
  {
    id: 3,
    title: "Recibí presupuesto",
    desc: "Obtené un presupuesto estimado al instante o por mail.",
    icon: <DollarSign className="w-8 h-8 md:w-9 md:h-9" />,
  },
];

const IconStep: React.FC<{
  title: string;
  desc: string;
  icon: React.ReactNode;
}> = ({ title, desc, icon }) => {
  return (
    <div className="flex items-center text-left gap-3 rounded-xl border border-[rgb(var(--brand-600)/0.16)] bg-[rgb(var(--surface)/0.92)] p-3.5">
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center bg-[rgb(var(--brand-600)/0.10)] text-[rgb(var(--brand-700))] shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm md:text-base font-semibold text-gray-900 leading-tight">{title}</div>
        <div className="text-xs md:text-sm text-gray-600 mt-0.5">{desc}</div>
      </div>
    </div>
  );
};

const CotizadorNew: React.FC = () => {
  return (
    <section className="max-w-frame mx-auto my-6">
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-[rgb(var(--brand-600)/0.16)] bg-[linear-gradient(135deg,rgb(var(--surface)),rgb(var(--page-bg)))] shadow-sm">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgb(var(--brand-600)/0.12),transparent_38%)]" />
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center p-5 sm:p-6 md:p-8">
          <div className="space-y-5 md:space-y-6">
            <div>
              <h3 className={cn([satoshi.className, "text-xl sm:text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight text-primary leading-tight"])}>
                Cotizá en tiempo real
              </h3>
              <div className="w-16 sm:w-20 h-1 rounded mt-3 mb-4 bg-accent" />
              <div className="flex items-center gap-4 mb-3 md:mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold bg-[rgb(var(--brand-600))] text-white">
                  Atención exclusiva
                </span>
              </div>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-xl leading-relaxed">
                Con nuestro cotizador obtendrás una estimación rápida y confiable. Elegí el producto, cargá las medidas y recibí un presupuesto estimado para tu obra.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 md:gap-4">
              {steps.map((s) => (
                <IconStep key={s.id} title={s.title} desc={s.desc} icon={s.icon} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-lg border border-[rgb(var(--brand-600)/0.16)] bg-[rgb(var(--surface))]">
              <div className="relative h-52 sm:h-60 md:h-64">
                <Image
                  src="/images/home/cotizador/mockup.jpg"
                  alt="Vista previa del cotizador"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 520px"
                />
                <div className="absolute top-3 left-3 md:top-4 md:left-4 px-3 py-1 rounded-full text-xs font-semibold shadow bg-[rgb(var(--brand-600))] text-white">
                  Cotizador Online
                </div>
              </div>
              {/* <div className="p-4 md:p-5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="h-9 rounded-md bg-[rgba(0,0,0,0.04)]" aria-hidden="true" />
                  <div className="h-9 rounded-md bg-[rgba(0,0,0,0.04)]" aria-hidden="true" />
                  <div className="h-9 rounded-md bg-[rgba(0,0,0,0.04)]" aria-hidden="true" />
                  <div className="h-9 rounded-md bg-[rgba(0,0,0,0.04)]" aria-hidden="true" />
                </div>
                <div className="h-10 mt-3 rounded-md bg-[rgba(139,94,60,0.15)]" aria-hidden="true" />
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CotizadorNew;

