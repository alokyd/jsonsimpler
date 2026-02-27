import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "JSON to Code Generator – TypeScript, Java, C#, Go, Python",
    description:
        "Generate TypeScript interfaces, Java classes, C# models, Go structs, and Python dataclasses from JSON.",
    openGraph: {
        title: "JSON to Code Generator",
        description: "Generate typed code from JSON in TypeScript, Java, C#, Go, and Python.",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
