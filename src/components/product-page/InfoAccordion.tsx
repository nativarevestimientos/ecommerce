"use client";

import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Product } from "@/types/product";

function normalizeDescriptionToHtml(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
  if (looksLikeHtml) {
    return raw
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/\son\w+=(?:"[^"]*"|'[^']*')/gi, "")
      .replace(/(href|src)=(["'])\s*javascript:[\s\S]*?\2/gi, '$1=$2#$2');
  }

  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const paragraphs = escaped.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return paragraphs
    .map((paragraph) => {
      const lines = paragraph.split("\n").map((l) => l.trimEnd());
      const bulletItems = lines
        .map((l) => l.trim())
        .filter(Boolean)
        .filter((l) => /^-+\s+/.test(l))
        .map((l) => l.replace(/^-+\s+/, "").trim())
        .filter(Boolean);

      const isAllBullets = lines.filter((l) => l.trim().length > 0).every((l) => /^-+\s+/.test(l.trim()));
      if (isAllBullets && bulletItems.length > 0) {
        return `<ul>${bulletItems.map((it) => `<li>${it}</li>`).join("")}</ul>`;
      }

      const formatted = lines
        .map((line) => {
          const trimmed = line.trim();
          if (/^[A-ZÁÉÍÓÚÑÜ0-9][A-ZÁÉÍÓÚÑÜ0-9\s\/-]{2,}:\s*/.test(trimmed)) {
            return `<strong>${trimmed}</strong>`;
          }
          return line;
        })
        .join("<br/>");

      return `<p>${formatted}</p>`;
    })
    .join("");
}

const InfoAccordion = ({ product, compact = false }: { product: Product; compact?: boolean }) => {
  const toDisplay = (v: number | null | undefined, opts?: Intl.NumberFormatOptions) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return "—";
    return v.toLocaleString("es-AR", { maximumFractionDigits: 4, ...opts });
  };
  const toNumber = (value: any): number | null => {
    const v = String(value ?? "").trim();
    if (!v) return null;
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const ext = product.external;
  const rendimiento = toNumber(ext?.rendimiento);
  const largoCm = toNumber(ext?.largo);
  const anchoCm = toNumber(ext?.alto);
  const espesorMm = toNumber(ext?.espesor);
  const kg = toNumber(ext?.kg);
  const showUnit = (n: number | null) => typeof n === "number" && Number.isFinite(n);
  const descriptionHtml = normalizeDescriptionToHtml(product.description || "");
  const usoLabel = String(
    (product as any)?.uso ||
      (product as any)?.use ||
      (product as any)?.usoProducto ||
      (product as any)?.aplicacion ||
      (product as any)?.application ||
      (product as any)?.external?.uso ||
      (product as any)?.external?.use ||
      "",
  ).trim();
  return (
    <div className={compact ? "w-full" : "max-w-frame mx-auto"}>
      <div className="rounded-2xl border border-[rgb(var(--brand-600)/0.16)] bg-[rgb(var(--surface))] overflow-hidden shadow-sm">
        <Accordion type="single" collapsible defaultValue="tech" className="w-full">
          <AccordionItem value="tech" className="border-b-0">
            <AccordionTrigger className="px-4 sm:px-5 hover:no-underline text-base font-semibold text-[rgb(var(--brand-900))]">
              <div className="flex items-center justify-between w-full gap-3">
                <span>Información técnica</span>
                <span className="text-xs font-medium text-[rgb(var(--brand-700))]">
                  Rendimiento: {toDisplay(rendimiento)} m²/tabla
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 sm:px-5">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base text-[rgb(var(--brand-800))]">
                <li><strong>Uso:</strong> {usoLabel.length > 0 ? usoLabel : "—"}</li>
                <li><strong>Largo/Alto:</strong> {toDisplay(largoCm)}{showUnit(largoCm) ? " cm" : ""}</li>
                <li><strong>Ancho:</strong> {toDisplay(anchoCm)}{showUnit(anchoCm) ? " cm" : ""}</li>
                <li><strong>Espesor:</strong> {toDisplay(espesorMm)}{showUnit(espesorMm) ? " mm" : ""}</li>
                <li><strong>Kg:</strong> {toDisplay(kg, { maximumFractionDigits: 2 })}</li>
                <li><strong>Rendimiento:</strong> {toDisplay(rendimiento)} m²/tabla</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* <AccordionItem value="more">
            <AccordionTrigger>Más información</AccordionTrigger>
            <AccordionContent>
              <div className="text-sm text-gray-700">
                <div><strong>Envío:</strong> Consultar envío</div>
              </div>
            </AccordionContent>
          </AccordionItem> */}
        </Accordion>
      </div>

      <div className="w-full mt-4 lg:hidden">
        <div className="rounded-2xl border border-[rgb(var(--brand-600)/0.16)] bg-[rgb(var(--surface))] overflow-hidden shadow-sm">
          <div className="px-4 sm:px-5 py-3 border-b border-[rgb(var(--brand-600)/0.12)]">
            <div className="text-base font-semibold text-[rgb(var(--brand-900))]">
              Descripción
            </div>
          </div>
          <div className="px-4 sm:px-5 py-4">
            {descriptionHtml ? (
              <div
                className="prose max-w-none text-base leading-relaxed text-[rgb(var(--brand-800))]"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <div className="text-base text-[rgb(var(--brand-700)/0.75)]">
                No hay descripción disponible.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoAccordion;

