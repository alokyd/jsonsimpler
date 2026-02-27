import {
    Code2,
    FileJson,
    CheckCircle,
    GitCompare,
    ArrowRightLeft,
    Braces,
    Search,
    Shuffle,
    TreePine,
    FileCode2,
} from "lucide-react";

export interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    description: string;
}

export const navItems: NavItem[] = [
    {
        title: "Formatter",
        href: "/json-formatter",
        icon: FileJson,
        description: "Pretty print & minify JSON",
    },
    {
        title: "Validator",
        href: "/json-validator",
        icon: CheckCircle,
        description: "Validate JSON in real-time",
    },
    {
        title: "Diff",
        href: "/json-diff",
        icon: GitCompare,
        description: "Compare two JSON documents",
    },
    {
        title: "Converters",
        href: "/json-converters",
        icon: ArrowRightLeft,
        description: "Convert JSON to CSV, XML, YAML & more",
    },
    {
        title: "Code Gen",
        href: "/json-to-code",
        icon: Code2,
        description: "Generate TypeScript, Java, Go & more",
    },
    {
        title: "Schema",
        href: "/json-schema",
        icon: Braces,
        description: "Generate & validate JSON Schema",
    },
    {
        title: "JSONPath",
        href: "/jsonpath-tester",
        icon: Search,
        description: "Test JSONPath queries",
    },
    {
        title: "Generator",
        href: "/json-generator",
        icon: Shuffle,
        description: "Generate random JSON data",
    },
    {
        title: "Viewer",
        href: "/json-viewer",
        icon: TreePine,
        description: "Explore large JSON trees",
    },
];
