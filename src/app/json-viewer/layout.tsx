import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Large JSON Viewer – Explore & Search JSON Trees",
    description: "View and explore large JSON files with a collapsible tree view. Search within JSON, copy paths, and see data types.",
    openGraph: { title: "Large JSON Viewer", description: "Explore large JSON files with collapsible tree view." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
