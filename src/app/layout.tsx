import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat } from "next/font/google"; 
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700"],
});

const kamerik = localFont({
  src: [
    {
      path: "./fonts/Kamerik105-Book.woff2", 
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Kamerik105-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-kamerik",
  display: "swap", 
});

export const metadata: Metadata = {
  title: "Zyntex Dashboard",
  description: "Painel de Gestão",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.variable} ${kamerik.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}