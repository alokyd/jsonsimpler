"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Loader2, Code2, TreePine } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import type { editor } from "monaco-editor";
import { DiffTreeView } from "./diff-tree-view";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[300px] bg-muted/30 rounded-lg">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

export interface LineDiff {
  lineNumber: number;
  type: "added" | "removed" | "changed";
}

export type ViewMode = "text" | "tree";

interface DiffJsonEditorProps {
  value: string;
  otherValue?: string; // The other side's value for tree diff comparison
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  minimap?: boolean;
  lineDiffs?: LineDiff[];
  diffSide?: "left" | "right";
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  showModeToggle?: boolean;
}

// Large file threshold for lazy loading (lines)
const LARGE_FILE_THRESHOLD = 1000;

// Compute line-by-line diff between two JSON strings with optional lazy loading
export function computeLineDiffs(
  leftJson: string,
  rightJson: string,
  maxLines?: number
): { leftDiffs: LineDiff[]; rightDiffs: LineDiff[] } {
  const leftLines = leftJson.split("\n");
  const rightLines = rightJson.split("\n");
  
  // For very large files, limit comparison to visible portion
  const effectiveMaxLines = maxLines || Math.max(leftLines.length, rightLines.length);
  const limitedLeftLines = leftLines.slice(0, effectiveMaxLines);
  const limitedRightLines = rightLines.slice(0, effectiveMaxLines);
  
  const leftDiffs: LineDiff[] = [];
  const rightDiffs: LineDiff[] = [];

  // Use optimized diff for large files
  if (limitedLeftLines.length > LARGE_FILE_THRESHOLD || limitedRightLines.length > LARGE_FILE_THRESHOLD) {
    return computeSimpleDiff(limitedLeftLines, limitedRightLines);
  }

  // Use LCS-based diff algorithm for better accuracy on smaller files
  const lcs = computeLCS(limitedLeftLines, limitedRightLines);
  
  let leftIdx = 0;
  let rightIdx = 0;
  let lcsIdx = 0;

  while (leftIdx < limitedLeftLines.length || rightIdx < limitedRightLines.length) {
    if (lcsIdx < lcs.length && leftIdx < limitedLeftLines.length && limitedLeftLines[leftIdx] === lcs[lcsIdx]) {
      if (rightIdx < limitedRightLines.length && limitedRightLines[rightIdx] === lcs[lcsIdx]) {
        leftIdx++;
        rightIdx++;
        lcsIdx++;
      } else {
        rightDiffs.push({ lineNumber: rightIdx + 1, type: "added" });
        rightIdx++;
      }
    } else if (lcsIdx < lcs.length && rightIdx < limitedRightLines.length && limitedRightLines[rightIdx] === lcs[lcsIdx]) {
      leftDiffs.push({ lineNumber: leftIdx + 1, type: "removed" });
      leftIdx++;
    } else if (leftIdx < limitedLeftLines.length && rightIdx < limitedRightLines.length) {
      leftDiffs.push({ lineNumber: leftIdx + 1, type: "changed" });
      rightDiffs.push({ lineNumber: rightIdx + 1, type: "changed" });
      leftIdx++;
      rightIdx++;
    } else if (leftIdx < limitedLeftLines.length) {
      leftDiffs.push({ lineNumber: leftIdx + 1, type: "removed" });
      leftIdx++;
    } else if (rightIdx < limitedRightLines.length) {
      rightDiffs.push({ lineNumber: rightIdx + 1, type: "added" });
      rightIdx++;
    }
  }

  return { leftDiffs, rightDiffs };
}

// Simple line-by-line diff for large files (O(n) instead of O(n*m))
function computeSimpleDiff(
  leftLines: string[],
  rightLines: string[]
): { leftDiffs: LineDiff[]; rightDiffs: LineDiff[] } {
  const leftDiffs: LineDiff[] = [];
  const rightDiffs: LineDiff[] = [];
  
  const maxLen = Math.max(leftLines.length, rightLines.length);
  
  for (let i = 0; i < maxLen; i++) {
    const leftLine = leftLines[i];
    const rightLine = rightLines[i];
    
    if (leftLine === undefined) {
      rightDiffs.push({ lineNumber: i + 1, type: "added" });
    } else if (rightLine === undefined) {
      leftDiffs.push({ lineNumber: i + 1, type: "removed" });
    } else if (leftLine !== rightLine) {
      leftDiffs.push({ lineNumber: i + 1, type: "changed" });
      rightDiffs.push({ lineNumber: i + 1, type: "changed" });
    }
  }
  
  return { leftDiffs, rightDiffs };
}

// Compute Longest Common Subsequence
function computeLCS(left: string[], right: string[]): string[] {
  const m = left.length;
  const n = right.length;
  
  // Create DP table
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (left[i - 1] === right[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (left[i - 1] === right[j - 1]) {
      lcs.unshift(left[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs;
}

// Helper to compare LineDiff arrays
function areDiffsEqual(a: LineDiff[], b: LineDiff[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].lineNumber !== b[i].lineNumber || a[i].type !== b[i].type) {
      return false;
    }
  }
  return true;
}

export function DiffJsonEditor({
  value,
  otherValue,
  onChange,
  language = "json",
  readOnly = false,
  height = "500px",
  minimap = false,
  lineDiffs = [],
  diffSide = "left",
  viewMode = "text",
  onViewModeChange,
  showModeToggle = false,
}: DiffJsonEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const lastDiffsRef = useRef<LineDiff[]>([]);

  // Apply decorations only when diff actually changes
  const applyDecorations = useCallback(() => {
    if (!editorRef.current) return;
    
    // Skip if diffs haven't changed
    if (areDiffsEqual(lastDiffsRef.current, lineDiffs)) {
      return;
    }
    lastDiffsRef.current = lineDiffs;

    const newDecorations: editor.IModelDeltaDecoration[] = lineDiffs.map((diff) => {
      let className = "";
      let glyphMarginClassName = "";
      
      switch (diff.type) {
        case "added":
          className = "diff-line-added";
          glyphMarginClassName = "diff-glyph-added";
          break;
        case "removed":
          className = "diff-line-removed";
          glyphMarginClassName = "diff-glyph-removed";
          break;
        case "changed":
          className = "diff-line-changed";
          glyphMarginClassName = "diff-glyph-changed";
          break;
      }

      return {
        range: {
          startLineNumber: diff.lineNumber,
          startColumn: 1,
          endLineNumber: diff.lineNumber,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className,
          glyphMarginClassName,
          overviewRuler: {
            color: diff.type === "added" ? "#22c55e" : diff.type === "removed" ? "#ef4444" : "#f59e0b",
            position: 1,
          },
        },
      };
    });

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [lineDiffs]);

  // Re-apply decorations when lineDiffs change
  useEffect(() => {
    applyDecorations();
  }, [applyDecorations]);

  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      lastDiffsRef.current = []; // Reset to force initial decoration
      applyDecorations();

      const handleResize = () => {
        editor.layout();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    },
    [applyDecorations]
  );

  // Mode toggle button
  const ModeToggle = showModeToggle ? (
    <div className="absolute top-2 right-2 z-10 flex gap-1 bg-background/80 backdrop-blur-sm rounded-md border border-border p-0.5">
      <Button
        variant={viewMode === "text" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => onViewModeChange?.("text")}
        title="Text mode"
      >
        <Code2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={viewMode === "tree" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => onViewModeChange?.("tree")}
        title="Tree mode"
      >
        <TreePine className="h-3.5 w-3.5" />
      </Button>
    </div>
  ) : null;

  return (
    <div className={cn("relative h-full", viewMode === "tree" ? "" : "diff-editor-container")}>
      {ModeToggle}
      
      {viewMode === "tree" ? (
        <DiffTreeView
          data={value}
          otherData={otherValue}
          side={diffSide}
          onChange={onChange}
          className="h-full"
          defaultExpanded={true}
          maxDepth={10}
          editable={!readOnly}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border h-full">
          <style jsx global>{`
            .diff-editor-container .diff-line-added {
              background-color: rgba(34, 197, 94, 0.15) !important;
            }
            .diff-editor-container .diff-line-removed {
              background-color: rgba(239, 68, 68, 0.15) !important;
            }
            .diff-editor-container .diff-line-changed {
              background-color: rgba(245, 158, 11, 0.15) !important;
            }
            .diff-editor-container .diff-glyph-added {
              background-color: #22c55e;
              width: 4px !important;
              margin-left: 3px;
              border-radius: 2px;
            }
            .diff-editor-container .diff-glyph-removed {
              background-color: #ef4444;
              width: 4px !important;
              margin-left: 3px;
              border-radius: 2px;
            }
            .diff-editor-container .diff-glyph-changed {
              background-color: #f59e0b;
              width: 4px !important;
              margin-left: 3px;
              border-radius: 2px;
            }
            /* Dark mode adjustments */
            .dark .diff-editor-container .diff-line-added {
              background-color: rgba(34, 197, 94, 0.2) !important;
            }
            .dark .diff-editor-container .diff-line-removed {
              background-color: rgba(239, 68, 68, 0.2) !important;
            }
            .dark .diff-editor-container .diff-line-changed {
              background-color: rgba(245, 158, 11, 0.2) !important;
            }
          `}</style>
          <MonacoEditor
            height={height}
            width="100%"
            language={language}
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            value={value}
            onChange={(val) => onChange?.(val || "")}
            onMount={handleEditorDidMount}
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
              glyphMargin: true,
              folding: true,
              lineDecorationsWidth: 10,
            }}
          />
        </div>
      )}
    </div>
  );
}
