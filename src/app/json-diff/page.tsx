"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { DiffJsonEditor, computeLineDiffs, ViewMode } from "@/components/editor/diff-json-editor";
import { ResizableEditorLayout } from "@/components/editor/resizable-editor-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useDebouncedCallback } from "use-debounce";
import { GitCompare, Plus, Minus, RefreshCw, AlertCircle, Code2, TreePine } from "lucide-react";

interface DiffResult {
    path: string;
    type: "added" | "removed" | "changed";
    oldValue?: any;
    newValue?: any;
}

function deepDiff(obj1: any, obj2: any, path: string = ""): DiffResult[] {
    const results: DiffResult[] = [];

    if (typeof obj1 !== typeof obj2) {
        results.push({ path: path || "(root)", type: "changed", oldValue: obj1, newValue: obj2 });
        return results;
    }

    if (typeof obj1 !== "object" || obj1 === null || obj2 === null) {
        if (obj1 !== obj2) {
            results.push({ path: path || "(root)", type: "changed", oldValue: obj1, newValue: obj2 });
        }
        return results;
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        const maxLen = Math.max(obj1.length, obj2.length);
        for (let i = 0; i < maxLen; i++) {
            const itemPath = `${path}[${i}]`;
            if (i >= obj1.length) {
                results.push({ path: itemPath, type: "added", newValue: obj2[i] });
            } else if (i >= obj2.length) {
                results.push({ path: itemPath, type: "removed", oldValue: obj1[i] });
            } else {
                results.push(...deepDiff(obj1[i], obj2[i], itemPath));
            }
        }
        return results;
    }

    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;
        if (!(key in obj1)) {
            results.push({ path: newPath, type: "added", newValue: obj2[key] });
        } else if (!(key in obj2)) {
            results.push({ path: newPath, type: "removed", oldValue: obj1[key] });
        } else {
            results.push(...deepDiff(obj1[key], obj2[key], newPath));
        }
    }

    return results;
}

function formatValue(val: any): string {
    if (typeof val === "string") return `"${val}"`;
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return String(val);
}

const sample1 = `{
  "name": "John",
  "age": 30,
  "city": "New York",
  "hobbies": ["reading", "coding"]
}`;

const sample2 = `{
  "name": "John",
  "age": 31,
  "country": "USA",
  "hobbies": ["reading", "coding", "gaming"]
}`;

export default function JsonDiffPage() {
    const [left, setLeft] = useLocalStorage("json-diff-left", sample1);
    const [right, setRight] = useLocalStorage("json-diff-right", sample2);
    const [diffs, setDiffs] = useState<DiffResult[]>([]);
    const [error, setError] = useState("");
    const [compared, setCompared] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("text");
    const [debouncedLeft, setDebouncedLeft] = useState(left);
    const [debouncedRight, setDebouncedRight] = useState(right);

    // Debounced diff computation (250ms)
    const updateDebouncedLeft = useDebouncedCallback((value: string) => {
        setDebouncedLeft(value);
    }, 250);

    const updateDebouncedRight = useDebouncedCallback((value: string) => {
        setDebouncedRight(value);
    }, 250);

    useEffect(() => {
        updateDebouncedLeft(left);
    }, [left, updateDebouncedLeft]);

    useEffect(() => {
        updateDebouncedRight(right);
    }, [right, updateDebouncedRight]);

    // Compute line-level diffs using debounced values for performance
    const { leftDiffs, rightDiffs } = useMemo(() => {
        return computeLineDiffs(debouncedLeft || "", debouncedRight || "");
    }, [debouncedLeft, debouncedRight]);

    const compare = useCallback(() => {
        try {
            const obj1 = JSON.parse(left);
            const obj2 = JSON.parse(right);
            const results = deepDiff(obj1, obj2);
            setDiffs(results);
            setError("");
            setCompared(true);
        } catch (e: any) {
            setError(e.message);
            setDiffs([]);
        }
    }, [left, right]);

    // Live counts from line diffs
    const added = rightDiffs.filter((d) => d.type === "added").length;
    const removed = leftDiffs.filter((d) => d.type === "removed").length;
    const changed = leftDiffs.filter((d) => d.type === "changed").length;
    const totalLiveChanges = added + removed + changed;

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">JSON Diff Tool</h1>
                <p className="text-muted-foreground">
                    Compare two JSON documents and see the differences highlighted.
                </p>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                {/* View Mode Toggle */}
                <div className="flex gap-1 bg-muted/50 rounded-md p-0.5 mr-2">
                    <Button
                        variant={viewMode === "text" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => setViewMode("text")}
                    >
                        <Code2 className="h-4 w-4 mr-1.5" />
                        Text
                    </Button>
                    <Button
                        variant={viewMode === "tree" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => setViewMode("tree")}
                    >
                        <TreePine className="h-4 w-4 mr-1.5" />
                        Tree
                    </Button>
                </div>
                <Button
                    onClick={compare}
                    className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
                >
                    <GitCompare className="h-4 w-4 mr-1.5" />
                    Compare
                </Button>
                <Button
                    variant="outline"
                    onClick={() => { setLeft(""); setRight(""); setDiffs([]); setCompared(false); setError(""); }}
                >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Reset
                </Button>
                {totalLiveChanges === 0 && !error && left && right && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        ✓ Identical
                    </Badge>
                )}
                {totalLiveChanges > 0 && (
                    <>
                        {added > 0 && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                <Plus className="h-3 w-3 mr-1" /> {added}
                            </Badge>
                        )}
                        {removed > 0 && (
                            <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
                                <Minus className="h-3 w-3 mr-1" /> {removed}
                            </Badge>
                        )}
                        {changed > 0 && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                <RefreshCw className="h-3 w-3 mr-1" /> {changed}
                            </Badge>
                        )}
                    </>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {error}
                </div>
            )}

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
                height="500px"
                defaultLeftSize={50}
                minLeftSize={25}
                minRightSize={25}
                unifiedFullscreen={true}
                className="mb-6"
                onCompare={compare}
            />

            {/* Diff Results */}
            {compared && diffs.length > 0 && (
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-lg font-semibold">Differences</h2>
                        <div className="flex gap-2">
                            {added > 0 && (
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                    <Plus className="h-3 w-3 mr-1" /> {added} Added
                                </Badge>
                            )}
                            {removed > 0 && (
                                <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
                                    <Minus className="h-3 w-3 mr-1" /> {removed} Removed
                                </Badge>
                            )}
                            {changed > 0 && (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                    <RefreshCw className="h-3 w-3 mr-1" /> {changed} Changed
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {diffs.map((diff, i) => (
                            <div
                                key={i}
                                className={`p-3 rounded-lg border font-mono text-sm ${diff.type === "added"
                                        ? "bg-emerald-500/5 border-emerald-500/20"
                                        : diff.type === "removed"
                                            ? "bg-red-500/5 border-red-500/20"
                                            : "bg-amber-500/5 border-amber-500/20"
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {diff.type === "added" && <Plus className="h-3.5 w-3.5 text-emerald-500" />}
                                    {diff.type === "removed" && <Minus className="h-3.5 w-3.5 text-red-500" />}
                                    {diff.type === "changed" && <RefreshCw className="h-3.5 w-3.5 text-amber-500" />}
                                    <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                        {diff.type}
                                    </span>
                                    <span className="text-foreground">{diff.path}</span>
                                </div>
                                {diff.type === "changed" && (
                                    <div className="ml-6 space-y-1 text-xs">
                                        <div className="text-red-400">- {formatValue(diff.oldValue)}</div>
                                        <div className="text-emerald-400">+ {formatValue(diff.newValue)}</div>
                                    </div>
                                )}
                                {diff.type === "added" && (
                                    <div className="ml-6 text-xs text-emerald-400">+ {formatValue(diff.newValue)}</div>
                                )}
                                {diff.type === "removed" && (
                                    <div className="ml-6 text-xs text-red-400">- {formatValue(diff.oldValue)}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
