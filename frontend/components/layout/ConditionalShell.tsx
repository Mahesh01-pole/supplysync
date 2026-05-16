"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

// Routes where the global Header/Footer should be hidden
// because those layouts provide their own sidebar navigation
const PORTAL_PREFIXES = [
  "/dashboard",
  "/orders",
  "/supplier",
  "/admin",
];

export function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isPortalPage = PORTAL_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );

  return (
    <>
      {!isPortalPage && <Header />}
      <main className="flex-1 flex flex-col">{children}</main>
      {!isPortalPage && <Footer />}
    </>
  );
}
