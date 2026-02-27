import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "JSONPath Tester – Query JSON Online",
    description: "Test JSONPath queries against JSON data with live results preview. Free and private.",
    openGraph: { title: "JSONPath Tester", description: "Test JSONPath expressions against JSON data online." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
