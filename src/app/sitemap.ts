import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://jsontools.dev";
    const tools = [
        "/json-formatter",
        "/json-validator",
        "/json-diff",
        "/json-converters",
        "/json-to-code",
        "/json-schema",
        "/jsonpath-tester",
        "/json-generator",
        "/json-viewer",
    ];

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 1,
        },
        ...tools.map((tool) => ({
            url: `${baseUrl}${tool}`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.8,
        })),
    ];
}
