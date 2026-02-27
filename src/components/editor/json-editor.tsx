"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full min-h-[300px] bg-muted/30 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    ),
});

interface JsonEditorProps {
    value: string;
    onChange?: (value: string) => void;
    language?: string;
    readOnly?: boolean;
    height?: string;
    minimap?: boolean;
}

export function JsonEditor({
    value,
    onChange,
    language = "json",
    readOnly = false,
    height = "500px",
    minimap = false,
}: JsonEditorProps) {
    const { resolvedTheme } = useTheme();

    return (
        <div className="overflow-hidden rounded-lg border border-border h-full">
            <MonacoEditor
                height={height}
                width="100%"
                language={language}
                theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                value={value}
                onChange={(val) => onChange?.(val || "")}
                options={{
                    readOnly,
                    minimap: { enabled: minimap },
                    fontSize: 13,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 2,
                    automaticLayout: true,
                    padding: { top: 12 },
                    renderLineHighlight: "line",
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    bracketPairColorization: { enabled: true },
                    formatOnPaste: !readOnly,
                }}
            />
        </div>
    );
}
