"use client";

import { useState, useEffect, useCallback } from "react";
import { JsonEditor } from "@/components/editor/json-editor";
import { Toolbar } from "@/components/editor/toolbar";
import { SingleEditorLayout } from "@/components/editor/single-editor-layout";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

function parseJsonError(input: string, errorMsg: string) {
    // Extract position info from JSON.parse error messages
    const posMatch = errorMsg.match(/position\s+(\d+)/i);
    if (posMatch) {
        const pos = parseInt(posMatch[1], 10);
        const lines = input.substring(0, pos).split("\n");
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        return { line, column, message: errorMsg };
    }
    return { line: 0, column: 0, message: errorMsg };
}

export default function JsonValidatorPage() {
    const [input, setInput] = useLocalStorage("json-validator-input", "");
    const [result, setResult] = useState<{
        valid: boolean;
        error?: { line: number; column: number; message: string };
        stats?: { keys: number; depth: number; type: string };
    } | null>(null);

    const validate = useCallback(
        (json: string) => {
            if (!json.trim()) {
                setResult(null);
                return;
            }
            try {
                const parsed = JSON.parse(json);
                // Calculate stats
                let keys = 0;
                let maxDepth = 0;
                const countKeys = (obj: any, depth: number) => {
                    if (depth > maxDepth) maxDepth = depth;
                    if (typeof obj === "object" && obj !== null) {
                        if (Array.isArray(obj)) {
                            obj.forEach((item) => countKeys(item, depth + 1));
                        } else {
                            const k = Object.keys(obj);
                            keys += k.length;
                            k.forEach((key) => countKeys(obj[key], depth + 1));
                        }
                    }
                };
                countKeys(parsed, 0);
                setResult({
                    valid: true,
                    stats: {
                        keys,
                        depth: maxDepth,
                        type: Array.isArray(parsed) ? "Array" : typeof parsed,
                    },
                });
            } catch (e: any) {
                const errorInfo = parseJsonError(json, e.message);
                setResult({ valid: false, error: errorInfo });
            }
        },
        []
    );

    useEffect(() => {
        const timer = setTimeout(() => validate(input), 300);
        return () => clearTimeout(timer);
    }, [input, validate]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">JSON Validator</h1>
                    {result?.valid && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Valid JSON
                        </Badge>
                    )}
                    {result && !result.valid && (
                        <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
                            <AlertCircle className="h-3 w-3 mr-1" /> Invalid JSON
                        </Badge>
                    )}
                </div>
                <p className="text-muted-foreground">
                    Validate your JSON in real-time with clear, human-readable error messages.
                </p>
            </div>

            {/* Results */}
            {result && (
                <div className="mb-4">
                    {result.valid ? (
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center gap-2 text-emerald-500 font-medium mb-2">
                                <CheckCircle2 className="h-5 w-5" />
                                Valid JSON
                            </div>
                            {result.stats && (
                                <div className="flex gap-4 text-sm text-muted-foreground">
                                    <span>Type: <span className="text-foreground font-medium">{result.stats.type}</span></span>
                                    <span>Keys: <span className="text-foreground font-medium">{result.stats.keys}</span></span>
                                    <span>Depth: <span className="text-foreground font-medium">{result.stats.depth}</span></span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div className="flex items-center gap-2 text-red-500 font-medium mb-2">
                                <AlertCircle className="h-5 w-5" />
                                Invalid JSON
                            </div>
                            {result.error && (
                                <div className="text-sm font-mono">
                                    <p className="text-red-400">{result.error.message}</p>
                                    {result.error.line > 0 && (
                                        <p className="text-muted-foreground mt-1">
                                            <Info className="h-3 w-3 inline mr-1" />
                                            Line {result.error.line}, Column {result.error.column}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <SingleEditorLayout
                editor={<JsonEditor value={input} onChange={(v) => setInput(v)} height="100%" />}
                label="JSON Input"
                height="600px"
                headerExtra={
                    <Toolbar
                        onCopy={() => navigator.clipboard.writeText(input)}
                        onClear={() => setInput("")}
                        onUpload={(content) => setInput(content)}
                    />
                }
            />
        </div>
    );
}
