"use client";

import { useState, useEffect, useCallback } from "react";
import { JsonEditor } from "@/components/editor/json-editor";
import { Toolbar } from "@/components/editor/toolbar";
import { ResizableEditorLayout } from "@/components/editor/resizable-editor-layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Search, AlertCircle, CheckCircle2 } from "lucide-react";

const sampleJson = `{
  "store": {
    "book": [
      { "category": "fiction", "author": "Herman Melville", "title": "Moby Dick", "price": 8.99 },
      { "category": "fiction", "author": "J.R.R. Tolkien", "title": "The Lord of the Rings", "price": 22.99 },
      { "category": "reference", "author": "Douglas Crockford", "title": "JavaScript: The Good Parts", "price": 29.99 }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  }
}`;

export default function JsonPathTesterPage() {
    const [input, setInput] = useLocalStorage("jsonpath-input", sampleJson);
    const [query, setQuery] = useLocalStorage("jsonpath-query", "$.store.book[*].title");
    const [result, setResult] = useState("");
    const [error, setError] = useState("");
    const [matchCount, setMatchCount] = useState(0);

    const evaluate = useCallback(async () => {
        if (!input.trim() || !query.trim()) {
            setResult("");
            setError("");
            return;
        }
        try {
            const data = JSON.parse(input);
            const { JSONPath } = await import("jsonpath-plus");
            const matches = JSONPath({ path: query, json: data });
            setResult(JSON.stringify(matches, null, 2));
            setMatchCount(Array.isArray(matches) ? matches.length : 0);
            setError("");
        } catch (e: any) {
            setError(e.message);
            setResult("");
            setMatchCount(0);
        }
    }, [input, query]);

    useEffect(() => {
        const timer = setTimeout(evaluate, 300);
        return () => clearTimeout(timer);
    }, [evaluate]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">JSONPath Tester</h1>
                <p className="text-muted-foreground">
                    Test JSONPath queries against your JSON data with live results.
                </p>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="JSONPath expression, e.g. $.store.book[*].title"
                        className="pl-9 font-mono text-sm"
                    />
                </div>
                {matchCount > 0 && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> {matchCount} match{matchCount !== 1 ? "es" : ""}
                    </Badge>
                )}
                <Toolbar
                    onCopy={() => navigator.clipboard.writeText(result)}
                    onClear={() => { setInput(""); setQuery(""); setResult(""); setError(""); }}
                    onUpload={(c) => setInput(c)}
                />
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono">
                    <AlertCircle className="h-4 w-4 inline mr-2" />{error}
                </div>
            )}

            <ResizableEditorLayout
                leftPanel={<JsonEditor value={input} onChange={(v) => setInput(v)} height="100%" />}
                rightPanel={<JsonEditor value={result} readOnly height="100%" />}
                leftLabel="JSON Input"
                rightLabel="Query Results"
                height="550px"
                defaultLeftSize={50}
                minLeftSize={25}
                minRightSize={25}
            />
        </div>
    );
}
