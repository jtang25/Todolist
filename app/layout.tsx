// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ToDoList",
  description: "Multi-project task tracker",
  icons: {
    icon: "/icon.png",     // put app/icon.png or public/icon.png
    shortcut: "/icon.png",
    apple: "/icon.png"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-50">{children}</body>
    </html>
  );
}
