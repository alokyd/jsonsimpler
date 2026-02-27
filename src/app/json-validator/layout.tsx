import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "JSON Validator – Validate JSON Online",
    description:
        "Validate JSON online with real-time error detection. Get clear, human-readable error messages with line and column indicators.",
    openGraph: {
        title: "JSON Validator",
        description: "Validate JSON online with real-time error detection.",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
