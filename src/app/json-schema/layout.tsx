import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "JSON Schema Generator & Validator",
    description: "Generate JSON Schema from JSON data and validate JSON against a schema. Free, fast, and private.",
    openGraph: { title: "JSON Schema Generator", description: "Generate and validate JSON Schema online." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
