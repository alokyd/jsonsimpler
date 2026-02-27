import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "JSON Tools – Developer Tools",
        short_name: "JSON Tools",
        description:
            "Free, fast, and private JSON developer tools. Format, validate, compare, convert, and generate JSON.",
        start_url: "/",
        display: "standalone",
        background_color: "#0a0a0a",
        theme_color: "#3b82f6",
        icons: [
            {
                src: "/icon-192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
