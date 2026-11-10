import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = cookies();
  const returnTo = cookieStore.get("returnTo")?.value || "/";
  
  // Limpiamos la cookie después de usarla
  const response = NextResponse.redirect(new URL(returnTo, request.url));
  response.cookies.delete("returnTo");
  
  return response;
} 