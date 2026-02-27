import Link from "next/link";
import { Braces } from "lucide-react";
import { navItems } from "@/lib/nav-items";

export function Footer() {
    return (
        <footer className="border-t border-border/40 bg-background/50">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                                <Braces className="h-4 w-4 text-white" />
                            </div>
                            JSON Tools
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Free, fast, and private JSON developer tools. All processing happens in your browser.
                        </p>
                    </div>

                    {/* Tools */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Tools</h3>
                        <ul className="space-y-2">
                            {navItems.slice(0, 5).map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-sm mb-3">More Tools</h3>
                        <ul className="space-y-2">
                            {navItems.slice(5).map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-sm mb-3">About</h3>
                        <ul className="space-y-2">
                            <li><span className="text-sm text-muted-foreground">100% Client-side</span></li>
                            <li><span className="text-sm text-muted-foreground">No data sent to servers</span></li>
                            <li><span className="text-sm text-muted-foreground">Works offline (PWA)</span></li>
                            <li><span className="text-sm text-muted-foreground">Open source</span></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} JSON Tools. All processing is done locally in your browser.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Built with Next.js, TypeScript & ❤️
                    </p>
                </div>
            </div>
        </footer>
    );
}
