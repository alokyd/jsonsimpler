import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Random JSON Generator – Generate Fake Test Data",
    description: "Generate random JSON data with customizable fields. Create fake test data for development and testing.",
    openGraph: { title: "Random JSON Generator", description: "Generate random JSON test data online." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
