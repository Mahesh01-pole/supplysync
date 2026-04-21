"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("auth_token");
    Cookies.remove("auth_role");
    Cookies.remove("auth_name");
    toast.success("Signed out successfully.", {
      style: {
        background: "#0f172a",
        color: "#f8fafc",
        border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: "12px",
      },
      iconTheme: { primary: "#ef4444", secondary: "#fff" },
    });
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center px-4 py-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors w-full"
    >
      <LogOut className="mr-3" size={18} />
      Logout
    </button>
  );
}
