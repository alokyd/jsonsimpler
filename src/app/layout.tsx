import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "JSON Tools – Free Online JSON Developer Tools",
    template: "%s | JSON Tools",
  },
  description:
    "Free, fast, and private JSON developer tools. Format, validate, compare, convert, and generate JSON – all in your browser.",
  keywords: [
    "JSON formatter",
    "JSON validator",
    "JSON diff",
    "JSON converter",
    "JSON to CSV",
    "JSON to TypeScript",
    "JSON tools",
    "developer tools",
  ],
  authors: [{ name: "JSON Tools" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "JSON Tools",
    title: "JSON Tools – Free Online JSON Developer Tools",
    description:
      "Free, fast, and private JSON developer tools. Format, validate, compare, convert, and generate JSON.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JSON Tools – Free Online JSON Developer Tools",
    description:
      "Free, fast, and private JSON developer tools. Format, validate, compare, convert, and generate JSON.",
  },
  metadataBase: new URL("https://jsontools.dev"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
