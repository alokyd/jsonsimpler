"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { navItems } from "@/lib/nav-items";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiffJsonEditor, computeLineDiffs, ViewMode } from "@/components/editor/diff-json-editor";
import { useDebouncedCallback } from "use-debounce";
import { ResizableEditorLayout } from "@/components/editor/resizable-editor-layout";
import { Toolbar } from "@/components/editor/toolbar";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  Braces,
  Zap,
  Shield,
  Wifi,
  ArrowRight,
  ChevronDown,
  GitCompare,
  Plus,
  Minus,
  RefreshCw,
  AlertCircle,
  Code2,
  TreePine,
} from "lucide-react";

const sampleOriginal = `{
  "name": "JSON Tools",
  "version": "1.0.0",
  "features": ["formatter", "validator", "diff"],
  "config": {
    "theme": "dark",
    "autoSave": true
  }
}`;

const sampleModified = `{
  "name": "JSON Tools",
  "version": "2.0.0",
  "features": ["formatter", "validator", "diff", "converters", "viewer"],
  "config": {
    "theme": "light",
    "autoSave": true,
    "newFeature": true
  }
}`;

const faqs = [
  {
    q: "Is my data safe?",
    a: "Absolutely. All processing happens 100% in your browser. No data is ever sent to any server.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. All tools are free to use without any sign-up or login required.",
  },
  {
    q: "Does it work offline?",
    a: "Yes! JSON Tools is a Progressive Web App (PWA). Install it and use it completely offline.",
  },
  {
    q: "What formats can I convert JSON to?",
    a: "CSV, XML, YAML, Excel (.xlsx), SQL INSERT statements, TypeScript interfaces, Java classes, C# models, Go structs, and Python classes.",
  },
  {
    q: "Is there a file size limit?",
    a: "Since everything runs in your browser, the only limit is your device's memory. Most modern devices handle files up to 50MB+ easily.",
  },
];


export default function HomePage() {
  const [left, setLeft] = useLocalStorage("home-diff-left", sampleOriginal);
  const [right, setRight] = useLocalStorage("home-diff-right", sampleModified);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("text");
  const [debouncedLeft, setDebouncedLeft] = useState(left);
  const [debouncedRight, setDebouncedRight] = useState(right);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Debounced diff computation (250ms)
  const updateDebouncedLeft = useDebouncedCallback((value: string) => {
    setDebouncedLeft(value);
  }, 250);

  const updateDebouncedRight = useDebouncedCallback((value: string) => {
    setDebouncedRight(value);
  }, 250);

  // Update debounced values when left/right change
  useEffect(() => {
    updateDebouncedLeft(left);
  }, [left, updateDebouncedLeft]);

  useEffect(() => {
    updateDebouncedRight(right);
  }, [right, updateDebouncedRight]);

  // Auto-focus on input editor when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      const monacoEditor = editorContainerRef.current?.querySelector('.monaco-editor textarea') as HTMLTextAreaElement;
      if (monacoEditor) {
        monacoEditor.focus();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Compute line-level diffs using debounced values for performance
  const { leftDiffs, rightDiffs } = useMemo(() => {
    return computeLineDiffs(debouncedLeft || "", debouncedRight || "");
  }, [debouncedLeft, debouncedRight]);

  // Count changes for badges
  const addedCount = rightDiffs.filter(d => d.type === "added").length;
  const removedCount = leftDiffs.filter(d => d.type === "removed").length;
  const changedCount = leftDiffs.filter(d => d.type === "changed").length;
  const totalChanges = addedCount + removedCount + changedCount;

  // Check for JSON parse errors
  useEffect(() => {
    try {
      if (left) JSON.parse(left);
      if (right) JSON.parse(right);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }, [left, right]);

  const swapPanels = useCallback(() => {
    const temp = left;
    setLeft(right);
    setRight(temp);
  }, [left, right, setLeft, setRight]);

  return (
    <div className="relative">
      {/* Hero + Workspace Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
          {/* Compact Hero */}
          <div className="text-center mb-6">
            <Badge variant="secondary" className="mb-3 px-4 py-1.5 text-sm font-medium">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              100% Free & Client-Side
            </Badge>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              JSON Developer Tools
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Compare, format, validate, convert — all in your browser. No servers, no sign-ups.
            </p>
          </div>

          {/* JSON Diff Workspace */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6 shadow-lg" ref={editorContainerRef}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5 text-blue-500" />
                  <h2 className="font-semibold text-lg">JSON Diff</h2>
                </div>
                {/* View Mode Toggle */}
                <div className="flex gap-1 bg-muted/50 rounded-md p-0.5">
                  <Button
                    variant={viewMode === "text" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setViewMode("text")}
                  >
                    <Code2 className="h-3.5 w-3.5 mr-1" />
                    Text
                  </Button>
                  <Button
                    variant={viewMode === "tree" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setViewMode("tree")}
                  >
                    <TreePine className="h-3.5 w-3.5 mr-1" />
                    Tree
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {totalChanges > 0 && (
                  <>
                    {addedCount > 0 && (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <Plus className="h-3 w-3 mr-1" /> {addedCount} Added
                      </Badge>
                    )}
                    {removedCount > 0 && (
                      <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
                        <Minus className="h-3 w-3 mr-1" /> {removedCount} Removed
                      </Badge>
                    )}
                    {changedCount > 0 && (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        <RefreshCw className="h-3 w-3 mr-1" /> {changedCount} Changed
                      </Badge>
                    )}
                  </>
                )}
                {totalChanges === 0 && !error && left && right && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    No differences
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Button onClick={swapPanels} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Swap
              </Button>
              <Toolbar
                onCopy={() => navigator.clipboard.writeText(JSON.stringify({ original: left, modified: right }, null, 2))}
                downloadContent={JSON.stringify({ original: left, modified: right }, null, 2)}
                downloadFilename="diff.json"
                onClear={() => { setLeft(""); setRight(""); setError(""); }}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                {error}
              </div>
            )}

            {/* Editor - Bigger height for landing page with inline diff */}
            <ResizableEditorLayout
              leftPanel={
                <DiffJsonEditor
                  value={left}
                  otherValue={right}
                  onChange={(v) => setLeft(v)}
                  height="100%"
                  lineDiffs={leftDiffs}
                  diffSide="left"
                  viewMode={viewMode}
                />
              }
              rightPanel={
                <DiffJsonEditor
                  value={right}
                  otherValue={left}
                  onChange={(v) => setRight(v)}
                  height="100%"
                  lineDiffs={rightDiffs}
                  diffSide="right"
                  viewMode={viewMode}
                />
              }
              leftLabel="Original JSON"
              rightLabel="Modified JSON"
              height="550px"
              defaultLeftSize={50}
              minLeftSize={25}
              minRightSize={25}
              unifiedFullscreen={true}
              onCompare={() => {
                try {
                  JSON.parse(left);
                  JSON.parse(right);
                  setError("");
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            />

            {/* Quick Links */}
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <span>More tools:</span>
              <Link href="/json-formatter" className="text-blue-500 hover:underline">Formatter</Link>
              <span>•</span>
              <Link href="/json-converters" className="text-blue-500 hover:underline">Converters</Link>
              <span>•</span>
              <Link href="/json-viewer" className="text-blue-500 hover:underline">Viewer</Link>
              <span>•</span>
              <Link href="#tools" className="text-blue-500 hover:underline">All Tools ↓</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/40 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Blazing Fast", desc: "Everything runs locally. No network latency." },
              { icon: Shield, title: "100% Private", desc: "Your data never leaves your browser." },
              { icon: Wifi, title: "Works Offline", desc: "Install as PWA. Use anywhere, anytime." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Every JSON tool you need
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Professional-grade tools built for developers. No ads, no tracking, no BS.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center shrink-0 group-hover:from-blue-500/20 group-hover:to-violet-500/20 transition-colors">
                    <item.icon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold group-hover:text-blue-500 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/0 group-hover:text-blue-500 transition-all group-hover:translate-x-0 -translate-x-2" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 border-t border-border/40 bg-muted/10">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border/50 bg-card overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer p-5 font-medium hover:bg-muted/50 transition-colors">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-background p-10 md:p-16">
            <div className="h-14 w-14 mx-auto mb-6 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Braces className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start working with JSON now
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              No sign-up needed. Just pick a tool and get to work. It&apos;s that simple.
            </p>
            <Button asChild size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white border-0">
              <Link href="/json-formatter">
                Open JSON Formatter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "JSON Tools",
            description: "Free online JSON developer tools – format, validate, compare, convert, and generate JSON.",
            url: "https://jsontools.dev",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
      />
    </div>
  );
}
