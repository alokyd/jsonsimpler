import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "JSON Converters – Convert JSON to CSV, XML, YAML, SQL & Excel",
    description:
        "Convert JSON to CSV, XML, YAML, SQL INSERT statements, and Excel. Also convert CSV, XML, and YAML back to JSON.",
    openGraph: {
        title: "JSON Converters",
        description: "Convert JSON to and from CSV, XML, YAML, SQL, and Excel.",
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
