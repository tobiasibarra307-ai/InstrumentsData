import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ibarra Instruments | Registro",
  description: "Registro e inventario de instrumentos musicales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}