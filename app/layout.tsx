import { Metadata } from "next";
import { ClientLayout } from "./client-layout";

export const metadata: Metadata = {
  title: "Learn Turkish",
  description: "An app to learn Turkish language",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
