/**
 * usePageTitle — sets the browser tab title declaratively in client components.
 * Usage:  usePageTitle("Dashboard");  → "Dashboard | SupplySync"
 */
import { useEffect } from "react";

export function usePageTitle(title: string, suffix = "SupplySync") {
  useEffect(() => {
    document.title = suffix ? `${title} | ${suffix}` : title;
    return () => {
      document.title = suffix; // reset on unmount
    };
  }, [title, suffix]);
}
