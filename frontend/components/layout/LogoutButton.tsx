"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("userId");
    Cookies.remove("userName");
    Cookies.remove("userRole");
    Cookies.remove("supplierId");
    toast.success("Signed out successfully.");
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
