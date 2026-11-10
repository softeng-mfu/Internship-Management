import type { ReactNode } from "react";
import "./globals.css";
import PrivacyNotice from "./privacy-notice";
export const metadata = {
  title: "Internly — Your next chapter",
  description: "A thoughtful workspace for your internship journey.",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* Extensions such as Grammarly add body attributes before hydration.
          Suppress only this element's mismatch; child components remain checked. */}
      <body suppressHydrationWarning>{children}<PrivacyNotice /></body>
    </html>
  );
}
