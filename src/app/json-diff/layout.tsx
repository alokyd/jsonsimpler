import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "JSON Diff Tool – Compare JSON Online",
    description:
        "Compare two JSON documents side by side. See additions, removals, and changes highlighted with a visual diff view.",
    openGraph: {
        title: "JSON Diff Tool",
        description: "Compare two JSON documents side by side online.",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
