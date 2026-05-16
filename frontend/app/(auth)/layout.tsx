import { Toaster } from "react-hot-toast";

// Auth pages (login/register) get NO header or footer
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
