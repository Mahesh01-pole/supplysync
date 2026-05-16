import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | SupplySync Buyer",
    default: "Dashboard | SupplySync Buyer",
  },
  description: "Manage your orders, track deliveries, and connect with suppliers on SupplySync.",
};

// This file is a server component that wraps the client layout
// The actual layout UI is in layout.tsx (client component)
export default function BuyerMetadataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
