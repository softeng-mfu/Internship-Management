import type { ReactNode } from "react";
import "./globals.css";
export const metadata = {
  title: "Internly — Your next chapter",
  description: "A thoughtful workspace for your internship journey.",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
