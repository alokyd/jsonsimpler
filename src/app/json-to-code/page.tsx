"use client";

import { useState, useCallback } from "react";
import { JsonEditor } from "@/components/editor/json-editor";
import { Toolbar } from "@/components/editor/toolbar";
import { ResizableEditorLayout } from "@/components/editor/resizable-editor-layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { jsonToTypeScript, jsonToJava, jsonToCSharp, jsonToGo, jsonToPython } from "@/lib/code-generators";
import { Code2, AlertCircle } from "lucide-react";

const sampleJson = `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "isActive": true,
  "scores": [95, 87, 92],
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zip": "10001"
  },
  "tags": ["developer", "designer"]
}`;

const languages = [
    { id: "typescript", label: "TypeScript", lang: "typescript" },
    { id: "java", label: "Java", lang: "java" },
    { id: "csharp", label: "C#", lang: "csharp" },
    { id: "go", label: "Go", lang: "go" },
    { id: "python", label: "Python", lang: "python" },
];

export default function JsonToCodePage() {
    const [input, setInput] = useLocalStorage("json-to-code-input", sampleJson);
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const [activeLang, setActiveLang] = useState("typescript");
    const [className, setClassName] = useState("Root");

    const generate = useCallback(() => {
        setError("");
        try {
            let result = "";
            switch (activeLang) {
                case "typescript": result = jsonToTypeScript(input, className); break;
                case "java": result = jsonToJava(input, className); break;
                case "csharp": result = jsonToCSharp(input, className); break;
                case "go": result = jsonToGo(input, className); break;
                case "python": result = jsonToPython(input, className); break;
            }
            setOutput(result);
        } catch (e: any) {
            setError(e.message);
            setOutput("");
        }
    }, [input, activeLang, className]);

    const selectedLang = languages.find((l) => l.id === activeLang);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">JSON to Code Generator</h1>
                <p className="text-muted-foreground">
                    Generate typed code from JSON – TypeScript, Java, C#, Go, and Python.
                </p>
            </div>

            <Tabs value={activeLang} onValueChange={setActiveLang} className="mb-4">
                <TabsList className="bg-muted/50">
                    {languages.map((lang) => (
                        <TabsTrigger key={lang.id} value={lang.id} className="text-xs px-3">
                            {lang.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Button onClick={generate} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white">
                    <Code2 className="h-4 w-4 mr-1.5" />
                    Generate
                </Button>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class name" className="w-36" />
                <Toolbar
                    onCopy={() => navigator.clipboard.writeText(output)}
                    downloadContent={output}
                    downloadFilename={`${className}.${activeLang === "typescript" ? "ts" : activeLang === "java" ? "java" : activeLang === "csharp" ? "cs" : activeLang === "go" ? "go" : "py"}`}
                    onClear={() => { setInput(""); setOutput(""); setError(""); }}
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
                rightPanel={<JsonEditor value={output} readOnly height="100%" language={selectedLang?.lang || "plaintext"} />}
                leftLabel="JSON Input"
                rightLabel={`Generated ${selectedLang?.label} Code`}
                height="500px"
                defaultLeftSize={50}
                minLeftSize={25}
                minRightSize={25}
            />
        </div>
    );
}
