import type { Metadata } from "next";
import { Manrope, Bricolage_Grotesque, ADLaM_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { BugHiveChatBox } from "@/components/features/chat/BugHiveChatBox";

const fontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = ADLaM_Display({
  weight: "400",
  subsets: ["adlam"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "BugHive",
  description: "BugHive – collaborative bug tracking and solutions",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased overflow-x-hidden`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster position="top-right" />
          <BugHiveChatBox />
        </ThemeProvider>
      </body>
    </html>
  );
}
