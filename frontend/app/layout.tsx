import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ConditionalShell } from "@/components/layout/ConditionalShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SupplySync",
  description: "B2B Industrial Order Allocation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} flex min-h-screen flex-col font-sans antialiased text-foreground bg-background`}
      >
        <ConditionalShell>{children}</ConditionalShell>
        <Toaster
          position="top-right"
          toastOptions={{
            success: { duration: 3000 },
            error: { duration: 4000 },
          }}
        />
      </body>
    </html>
  );
}
