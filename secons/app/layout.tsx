import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SECONS — EdBlazon in the palm of your hands",
  description:
    "The single source of truth for EdBlazon — your comprehensive event management platform for the annual college cultural & sports week.",
  keywords: [
    "EdBlazon",
    "SECONS",
    "college event management",
    "cultural week",
    "sports fixtures",
    "leaderboard",
  ],
  authors: [{ name: "SECONS Team" }],
  openGraph: {
    title: "SECONS — EdBlazon in the palm of your hands",
    description:
      "Manage events, sports, finance, and communications for your college cultural week — all in one platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${lexend.variable} antialiased`}
        style={{ fontFamily: "var(--font-body)" }}
      >
        <TooltipProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TooltipProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "var(--radius-md)",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
