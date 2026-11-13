import type { Metadata, Viewport } from "next";
import AdminSW from "@/components/admin/AdminSW";

// The admin panel installs on a phone as its own app ("Homiqo Admin").
export const metadata: Metadata = {
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "Homiqo Admin", statusBarStyle: "default" },
  icons: { apple: "/admin-icon-192.png" },
};
export const viewport: Viewport = { themeColor: "#0D5B58" };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSW />
      {children}
    </>
  );
}
