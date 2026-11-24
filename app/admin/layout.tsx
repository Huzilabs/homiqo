import type { Metadata, Viewport } from "next";
import AdminSW from "@/components/admin/AdminSW";
import OrderSound from "@/components/admin/OrderSound";

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
      {/* The store clips sideways overflow on <html>/<body>; on an iPhone home-screen app that can stop the
          page from scrolling, so the admin turns it off (its wide tables scroll inside their own boxes). */}
      <style>{`html,body{overflow-x:visible!important}`}</style>
      <AdminSW />
      <OrderSound />
      {children}
    </>
  );
}
