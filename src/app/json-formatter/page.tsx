"use client";

import { useState, useCallback } from "react";
import { JsonEditor } from "@/components/editor/json-editor";
import { Toolbar } from "@/components/editor/toolbar";
import { ResizableEditorLayout } from "@/components/editor/resizable-editor-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Wand2, Minimize2 as MinifyIcon, AlertCircle, CheckCircle2 } from "lucide-react";

const sampleJson = `{
  "name": "JSON Tools",
  "version": "1.0.0",
  "features": ["formatter","validator","diff","converters"],
  "config": { "theme": "dark", "autoSave": true }
}`;

export default function JsonFormatterPage() {
    const [input, setInput] = useLocalStorage("json-formatter-input", sampleJson);
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const [status, setStatus] = useState<"idle" | "valid" | "error">("idle");

    const format = useCallback(
        (spaces: number = 2) => {
            try {
                const parsed = JSON.parse(input);
                const formatted = JSON.stringify(parsed, null, spaces);
                setOutput(formatted);
                setError("");
                setStatus("valid");
            } catch (e: any) {
                setError(e.message);
                setOutput("");
                setStatus("error");
            }
        },
        [input]
    );

    const minify = useCallback(() => {
        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setOutput(minified);
            setError("");
            setStatus("valid");
        } catch (e: any) {
            setError(e.message);
            setOutput("");
            setStatus("error");
        }
    }, [input]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(output || input);
    }, [output, input]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">JSON Formatter & Beautifier</h1>
                    {status === "valid" && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Valid
                        </Badge>
                    )}
                    {status === "error" && (
                        <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
                            <AlertCircle className="h-3 w-3 mr-1" /> Error
                        </Badge>
                    )}
                </div>
                <p className="text-muted-foreground">
                    Pretty print, beautify, and minify your JSON with syntax highlighting.
                </p>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Button onClick={() => format(2)} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white">
                    <Wand2 className="h-4 w-4 mr-1.5" />
                    Format (2 spaces)
                </Button>
                <Button variant="outline" onClick={() => format(4)}>
                    Format (4 spaces)
                </Button>
                <Button variant="outline" onClick={minify}>
                    <MinifyIcon className="h-4 w-4 mr-1.5" />
                    Minify
                </Button>
                <Toolbar
                    onCopy={handleCopy}
                    downloadContent={output || input}
                    downloadFilename="formatted.json"
                    onClear={() => { setInput(""); setOutput(""); setError(""); setStatus("idle"); }}
                    onUpload={(content) => setInput(content)}
                />
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {error}
                </div>
            )}

            <ResizableEditorLayout
                leftPanel={<JsonEditor value={input} onChange={(v) => setInput(v)} height="100%" />}
                rightPanel={<JsonEditor value={output} readOnly height="100%" />}
                leftLabel="Input"
                rightLabel="Output"
                height="500px"
                defaultLeftSize={50}
                minLeftSize={25}
                minRightSize={25}
            />
        </div>
    );
}
