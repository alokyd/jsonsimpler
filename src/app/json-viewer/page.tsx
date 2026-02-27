"use client";

import { useState, useCallback, useMemo } from "react";
import { JsonEditor } from "@/components/editor/json-editor";
import { Toolbar } from "@/components/editor/toolbar";
import { SingleEditorLayout } from "@/components/editor/single-editor-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
    ChevronRight,
    ChevronDown,
    Search,
    Copy,
    TreePine,
    AlertCircle,
} from "lucide-react";

const sampleJson = `{
  "company": {
    "name": "TechCorp",
    "employees": [
      { "id": 1, "name": "Alice", "role": "Engineer", "skills": ["React", "Node.js", "TypeScript"] },
      { "id": 2, "name": "Bob", "role": "Designer", "skills": ["Figma", "CSS", "UI/UX"] },
      { "id": 3, "name": "Charlie", "role": "Manager", "skills": ["Leadership", "Strategy"] }
    ],
    "address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102"
    },
    "founded": 2020,
    "active": true
  }
}`;

interface TreeNodeProps {
    keyName: string | number;
    value: any;
    path: string;
    depth: number;
    searchTerm: string;
    onCopyPath: (path: string) => void;
}

function TreeNode({ keyName, value, path, depth, searchTerm, onCopyPath }: TreeNodeProps) {
    const [expanded, setExpanded] = useState(depth < 2);

    const isObject = typeof value === "object" && value !== null;
    const isArray = Array.isArray(value);
    const entries = isObject ? (isArray ? value.map((v: any, i: number) => [i, v]) : Object.entries(value)) : [];
    const childCount = entries.length;

    const matchesSearch =
        searchTerm &&
        (String(keyName).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (!isObject && String(value).toLowerCase().includes(searchTerm.toLowerCase())));

    const getTypeColor = (val: any) => {
        if (val === null) return "text-gray-500";
        if (typeof val === "string") return "text-emerald-500";
        if (typeof val === "number") return "text-blue-500";
        if (typeof val === "boolean") return "text-amber-500";
        return "text-foreground";
    };

    const getTypeBadge = (val: any) => {
        if (val === null) return "null";
        if (Array.isArray(val)) return `array[${val.length}]`;
        if (typeof val === "object") return `object{${Object.keys(val).length}}`;
        return typeof val;
    };

    return (
        <div>
            <div
                className={`group flex items-center gap-1 py-0.5 px-1 rounded hover:bg-muted/50 cursor-pointer ${matchesSearch ? "bg-amber-500/10 ring-1 ring-amber-500/30" : ""
                    }`}
                style={{ paddingLeft: `${depth * 16 + 4}px` }}
                onClick={() => isObject && setExpanded(!expanded)}
            >
                {isObject ? (
                    expanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}

                <span className="text-violet-400 text-sm font-medium">{keyName}</span>
                <span className="text-muted-foreground text-sm">:</span>

                {isObject ? (
                    <span className="text-muted-foreground text-xs ml-1">
                        {isArray ? `[${childCount}]` : `{${childCount}}`}
                    </span>
                ) : (
                    <span className={`text-sm ml-1 truncate max-w-md ${getTypeColor(value)}`}>
                        {value === null ? "null" : typeof value === "string" ? `"${value}"` : String(value)}
                    </span>
                )}

                <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {getTypeBadge(value)}
                </Badge>

                <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
                    onClick={(e) => { e.stopPropagation(); onCopyPath(path); }}
                    title="Copy path"
                >
                    <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
            </div>

            {isObject && expanded && (
                <div>
                    {entries.map((entry: any) => (
                        <TreeNode
                            key={`${path}.${entry[0]}`}
                            keyName={entry[0]}
                            value={entry[1]}
                            path={isArray ? `${path}[${entry[0]}]` : `${path}.${entry[0]}`}
                            depth={depth + 1}
                            searchTerm={searchTerm}
                            onCopyPath={onCopyPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function JsonViewerPage() {
    const [input, setInput] = useLocalStorage("json-viewer-input", sampleJson);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [showTree, setShowTree] = useState(true);

    const parsedData = useMemo(() => {
        try {
            const d = JSON.parse(input);
            setError("");
            return d;
        } catch (e: any) {
            setError(e.message);
            return null;
        }
    }, [input]);

    const handleCopyPath = useCallback((path: string) => {
        navigator.clipboard.writeText(path);
    }, []);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Large JSON Viewer</h1>
                <p className="text-muted-foreground">
                    Explore JSON with a collapsible tree view, search, and path copying.
                </p>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Button
                    variant={showTree ? "default" : "outline"}
                    onClick={() => setShowTree(!showTree)}
                    className={showTree ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white" : ""}
                >
                    <TreePine className="h-4 w-4 mr-1.5" />
                    {showTree ? "Show Editor" : "Show Tree"}
                </Button>
                {showTree && (
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search keys or values..."
                            className="pl-9"
                        />
                    </div>
                )}
                <Toolbar
                    onCopy={() => navigator.clipboard.writeText(input)}
                    onClear={() => setInput("")}
                    onUpload={(c) => setInput(c)}
                />
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono">
                    <AlertCircle className="h-4 w-4 inline mr-2" />{error}
                </div>
            )}

            {showTree && parsedData !== null ? (
                <div className="rounded-lg border border-border bg-card">
                    <ScrollArea className="h-[600px] p-3">
                        <div className="font-mono text-sm">
                            <TreeNode
                                keyName="(root)"
                                value={parsedData}
                                path="$"
                                depth={0}
                                searchTerm={searchTerm}
                                onCopyPath={handleCopyPath}
                            />
                        </div>
                    </ScrollArea>
                </div>
            ) : (
                <SingleEditorLayout
                    editor={<JsonEditor value={input} onChange={(v) => setInput(v)} height="100%" />}
                    label="JSON Editor"
                    height="600px"
                    headerExtra={
                        <Toolbar
                            onCopy={() => navigator.clipboard.writeText(input)}
                            onClear={() => setInput("")}
                            onUpload={(c) => setInput(c)}
                        />
                    }
                />
            )}
        </div>
    );
}
