import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salesforce POC Console | Multi-Org Integration & SOQL Studio",
  description:
    "Interactive Salesforce web console for Accounts, Contacts, Opportunities, SOQL queries, and schema exploration with dynamic credentials.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
