import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autenticación",
  description: "Página de autenticación de TucsDrinks",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {children}
    </div>
  );
} 