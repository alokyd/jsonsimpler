import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "JSON Formatter & Beautifier – Pretty Print JSON Online",
    description:
        "Format, beautify, and minify JSON online for free. Syntax highlighting, auto-format on paste, drag & drop upload, and error line highlighting.",
    openGraph: {
        title: "JSON Formatter & Beautifier",
        description: "Pretty print and minify JSON online. Free, fast, and private.",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
