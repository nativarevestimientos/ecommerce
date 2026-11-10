export const isNaveGaliciaEnabled =
  String(process.env.NEXT_PUBLIC_NAVE_GALICIA_ENABLED || "").trim().toLowerCase() === "true";
