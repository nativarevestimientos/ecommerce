import React from "react";
import PhotoSection from "./PhotoSection";
import { Product } from "@/types/product";
import { satoshi } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import AddToCardSection from "./AddToCardSection";

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

function formatearTituloProducto(nombre: string): string {
  if (!nombre || typeof nombre !== "string") return "";
  const palabrasMinusculas = new Set([
    "de",
    "del",
    "la",
    "el",
    "los",
    "las",
    "y",
    "e",
    "o",
    "u",
    "para",
    "con",
    "sin",
    "en",
    "por",
    "al",
  ]);
  return nombre
    .toLowerCase()
    .split(/\s+/)
    .map((palabra, indice) => {
      if (palabra === "x") return "X";
      if (/^[0-9]/.test(palabra)) return palabra;
      if (palabrasMinusculas.has(palabra) && indice !== 0) return palabra;
      if (!palabra) return palabra;
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(" ");
}

const Header = ({ data }: { data: Product }) => {
  const descriptionHtml = normalizeDescriptionToHtml(data.description || "");
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-10 items-start">
        <div>
          <PhotoSection data={data} />
        </div>
        <div className="pt-0 lg:pt-2">
          <h1
            className={cn([
              satoshi.className,
              "text-2xl sm:text-3xl md:text-[40px] font-semibold leading-[1.15] mb-3 sm:mb-4 uppercase",
            ])}
          >
            {formatearTituloProducto(data.name)}
          </h1>
          {data.uso && data.uso.trim().length > 0 && (
            <div className="mb-4">
              <span className="inline-flex items-center rounded-full border border-[rgb(var(--brand-600)/0.18)] bg-[rgb(var(--brand-600)/0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--brand-700))]">
                USO: {data.uso}
              </span>
            </div>
          )}
          
          <hr className="hidden md:block h-[1px] border-t-black/10 my-5" />
          <AddToCardSection data={data} />
        </div>
      </div>
      <div className="hidden lg:block mt-8 rounded-2xl border border-[rgb(var(--brand-600)/0.12)] bg-[rgb(var(--surface))] p-8">
        <div className="text-2xl font-bold text-[rgb(var(--brand-900))] mb-4">Descripción</div>
        {descriptionHtml ? (
          <div
            className="prose max-w-none text-lg leading-relaxed text-[rgb(var(--brand-800))]"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        ) : (
          <div className="text-lg text-[rgb(var(--brand-700))]">No hay descripción disponible.</div>
        )}
      </div>
    </>
  );
};

export default Header;
