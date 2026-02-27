"use client";

import { useState, useCallback, useMemo, useEffect, useRef, KeyboardEvent } from "react";
import { ChevronRight, ChevronDown, Copy, Check, Plus, Minus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Diff types for nodes
export type DiffType = "added" | "removed" | "changed" | "unchanged";

export interface NodeDiff {
  path: string;
  type: DiffType;
  oldValue?: any;
  newValue?: any;
}

interface DiffTreeViewProps {
  data: any;
  otherData?: any; // The other side's data for comparison
  side: "left" | "right";
  onChange?: (newData: any) => void;
  className?: string;
  defaultExpanded?: boolean;
  maxDepth?: number;
  editable?: boolean;
  nodeDiffs?: Map<string, NodeDiff>;
}

interface TreeNodeProps {
  keyName: string | number | null;
  value: any;
  depth: number;
  path: string;
  onUpdate?: (path: string, newValue: any) => void;
  defaultExpanded: boolean;
  maxDepth: number;
  editable: boolean;
  isLast: boolean;
  diffType: DiffType;
  nodeDiffs: Map<string, NodeDiff>;
  side: "left" | "right";
  isSelected: boolean;
  onSelect: (path: string) => void;
  nodeRef?: React.RefObject<HTMLDivElement>;
}

function getValueType(value: any): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function getValueColor(type: string, diffType: DiffType): string {
  if (diffType === "added") return "text-emerald-600 dark:text-emerald-400";
  if (diffType === "removed") return "text-red-600 dark:text-red-400";
  if (diffType === "changed") return "text-amber-600 dark:text-amber-400";
  
  switch (type) {
    case "string":
      return "text-emerald-600 dark:text-emerald-400";
    case "number":
      return "text-blue-600 dark:text-blue-400";
    case "boolean":
      return "text-amber-600 dark:text-amber-400";
    case "null":
      return "text-gray-500 dark:text-gray-400";
    default:
      return "text-foreground";
  }
}

function getDiffBackground(diffType: DiffType): string {
  switch (diffType) {
    case "added":
      return "bg-emerald-500/10 border-l-2 border-l-emerald-500";
    case "removed":
      return "bg-red-500/10 border-l-2 border-l-red-500";
    case "changed":
      return "bg-amber-500/10 border-l-2 border-l-amber-500";
    default:
      return "";
  }
}

function getDiffIcon(diffType: DiffType) {
  switch (diffType) {
    case "added":
      return <Plus className="h-3 w-3 text-emerald-500 shrink-0" />;
    case "removed":
      return <Minus className="h-3 w-3 text-red-500 shrink-0" />;
    case "changed":
      return <RefreshCw className="h-3 w-3 text-amber-500 shrink-0" />;
    default:
      return null;
  }
}

function TreeNode({
  keyName,
  value,
  depth,
  path,
  onUpdate,
  defaultExpanded,
  maxDepth,
  editable,
  isLast,
  diffType,
  nodeDiffs,
  side,
  isSelected,
  onSelect,
  nodeRef,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded && depth < maxDepth);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [copied, setCopied] = useState(false);
  const localRef = useRef<HTMLDivElement>(null);
  const ref = nodeRef || localRef;

  const type = getValueType(value);
  const isExpandable = type === "object" || type === "array";
  const childCount = isExpandable ? Object.keys(value || {}).length : 0;

  // Auto-expand nodes with diffs
  useEffect(() => {
    if (diffType !== "unchanged" && !isExpanded) {
      setIsExpanded(true);
    }
  }, [diffType]);

  const handleToggle = useCallback(() => {
    if (isExpandable) {
      setIsExpanded(!isExpanded);
    }
  }, [isExpandable, isExpanded]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" && isExpandable && !isExpanded) {
      e.preventDefault();
      setIsExpanded(true);
    } else if (e.key === "ArrowLeft" && isExpandable && isExpanded) {
      e.preventDefault();
      setIsExpanded(false);
    } else if (e.key === "Enter" && isExpandable) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  }, [isExpandable, isExpanded]);

  const handleDoubleClick = useCallback(() => {
    if (editable && !isExpandable) {
      setIsEditing(true);
      setEditValue(type === "string" ? value : JSON.stringify(value));
    }
  }, [editable, isExpandable, type, value]);

  const handleEditSubmit = useCallback(() => {
    if (!onUpdate) return;
    
    let newValue: any;
    try {
      if (type === "string") {
        newValue = editValue;
      } else {
        newValue = JSON.parse(editValue);
      }
      onUpdate(path, newValue);
    } catch {
      newValue = editValue;
      onUpdate(path, newValue);
    }
    setIsEditing(false);
  }, [editValue, onUpdate, path, type]);

  const handleCopy = useCallback(() => {
    const textToCopy = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  const renderValue = () => {
    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEditSubmit();
            if (e.key === "Escape") setIsEditing(false);
          }}
          className="bg-muted border border-border rounded px-1 py-0.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      );
    }

    const colorClass = getValueColor(type, diffType);

    switch (type) {
      case "string":
        return (
          <span className={cn("font-mono text-sm", colorClass)}>
            &quot;{value}&quot;
          </span>
        );
      case "number":
      case "boolean":
        return (
          <span className={cn("font-mono text-sm", colorClass)}>
            {String(value)}
          </span>
        );
      case "null":
        return (
          <span className={cn("font-mono text-sm italic", colorClass)}>
            null
          </span>
        );
      case "array":
        return (
          <span className="text-muted-foreground font-mono text-sm">
            [{childCount}]
          </span>
        );
      case "object":
        return (
          <span className="text-muted-foreground font-mono text-sm">
            {"{"}
            {childCount}
            {"}"}
          </span>
        );
      default:
        return <span className="font-mono text-sm">{String(value)}</span>;
    }
  };

  const renderChildren = () => {
    if (!isExpandable || !isExpanded) return null;

    const entries = Object.entries(value || {});
    return (
      <div className="ml-4 border-l border-border/50 pl-2">
        {entries.map(([childKey, childValue], index) => {
          const childPath = path ? `${path}.${childKey}` : childKey;
          const childDiff = nodeDiffs.get(childPath);
          const childDiffType = childDiff?.type || "unchanged";
          
          return (
            <TreeNode
              key={childKey}
              keyName={type === "array" ? index : childKey}
              value={childValue}
              depth={depth + 1}
              path={childPath}
              onUpdate={onUpdate}
              defaultExpanded={defaultExpanded}
              maxDepth={maxDepth}
              editable={editable}
              isLast={index === entries.length - 1}
              diffType={childDiffType}
              nodeDiffs={nodeDiffs}
              side={side}
              isSelected={false}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="select-none">
      <div
        ref={ref}
        tabIndex={0}
        className={cn(
          "flex items-center gap-1 py-0.5 px-1 rounded-sm group outline-none",
          getDiffBackground(diffType),
          isExpandable && "cursor-pointer",
          isSelected && "ring-2 ring-blue-500 ring-offset-1",
          "hover:bg-muted/50 focus:bg-muted/70"
        )}
        onClick={() => {
          onSelect(path);
          handleToggle();
        }}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Diff indicator */}
        {diffType !== "unchanged" && getDiffIcon(diffType)}

        {/* Expand/Collapse toggle */}
        <span className="w-4 h-4 flex items-center justify-center shrink-0">
          {isExpandable ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )
          ) : null}
        </span>

        {/* Key name */}
        {keyName !== null && (
          <>
            <span className={cn(
              "font-mono text-sm",
              diffType === "added" ? "text-emerald-600 dark:text-emerald-400" :
              diffType === "removed" ? "text-red-600 dark:text-red-400" :
              diffType === "changed" ? "text-amber-600 dark:text-amber-400" :
              "text-violet-600 dark:text-violet-400"
            )}>
              {typeof keyName === "number" ? `[${keyName}]` : `"${keyName}"`}
            </span>
            <span className="text-muted-foreground">:</span>
          </>
        )}

        {/* Value */}
        {renderValue()}

        {/* Copy button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
          title="Copy value"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </button>

        {/* Trailing comma */}
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>

      {/* Children */}
      {renderChildren()}
    </div>
  );
}

// Compute deep diff between two objects
export function computeDeepDiff(
  left: any,
  right: any,
  path: string = ""
): Map<string, NodeDiff> {
  const diffs = new Map<string, NodeDiff>();

  function compare(obj1: any, obj2: any, currentPath: string) {
    const type1 = getValueType(obj1);
    const type2 = getValueType(obj2);

    // Different types
    if (type1 !== type2) {
      diffs.set(currentPath || "(root)", {
        path: currentPath || "(root)",
        type: "changed",
        oldValue: obj1,
        newValue: obj2,
      });
      return;
    }

    // Primitives
    if (type1 !== "object" && type1 !== "array") {
      if (obj1 !== obj2) {
        diffs.set(currentPath || "(root)", {
          path: currentPath || "(root)",
          type: "changed",
          oldValue: obj1,
          newValue: obj2,
        });
      }
      return;
    }

    // Arrays
    if (type1 === "array") {
      const maxLen = Math.max(obj1?.length || 0, obj2?.length || 0);
      for (let i = 0; i < maxLen; i++) {
        const itemPath = currentPath ? `${currentPath}[${i}]` : `[${i}]`;
        if (i >= (obj1?.length || 0)) {
          diffs.set(itemPath, {
            path: itemPath,
            type: "added",
            newValue: obj2[i],
          });
          // Mark parent as changed
          if (currentPath && !diffs.has(currentPath)) {
            diffs.set(currentPath, { path: currentPath, type: "changed" });
          }
        } else if (i >= (obj2?.length || 0)) {
          diffs.set(itemPath, {
            path: itemPath,
            type: "removed",
            oldValue: obj1[i],
          });
          if (currentPath && !diffs.has(currentPath)) {
            diffs.set(currentPath, { path: currentPath, type: "changed" });
          }
        } else {
          compare(obj1[i], obj2[i], itemPath);
        }
      }
      return;
    }

    // Objects
    const allKeys = new Set([
      ...Object.keys(obj1 || {}),
      ...Object.keys(obj2 || {}),
    ]);

    for (const key of allKeys) {
      const keyPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (!(key in (obj1 || {}))) {
        diffs.set(keyPath, {
          path: keyPath,
          type: "added",
          newValue: obj2[key],
        });
        if (currentPath && !diffs.has(currentPath)) {
          diffs.set(currentPath, { path: currentPath, type: "changed" });
        }
      } else if (!(key in (obj2 || {}))) {
        diffs.set(keyPath, {
          path: keyPath,
          type: "removed",
          oldValue: obj1[key],
        });
        if (currentPath && !diffs.has(currentPath)) {
          diffs.set(currentPath, { path: currentPath, type: "changed" });
        }
      } else {
        compare(obj1[key], obj2[key], keyPath);
      }
    }
  }

  compare(left, right, path);
  return diffs;
}

export function DiffTreeView({
  data,
  otherData,
  side,
  onChange,
  className,
  defaultExpanded = true,
  maxDepth = 10,
  editable = false,
  nodeDiffs: externalDiffs,
}: DiffTreeViewProps) {
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedData = useMemo(() => {
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        setParseError(null);
        return parsed;
      } catch (e: any) {
        setParseError(e.message);
        return null;
      }
    }
    setParseError(null);
    return data;
  }, [data]);

  const parsedOtherData = useMemo(() => {
    if (typeof otherData === "string") {
      try {
        return JSON.parse(otherData);
      } catch {
        return null;
      }
    }
    return otherData;
  }, [otherData]);

  // Compute diffs between this side and the other side
  const nodeDiffs = useMemo(() => {
    if (externalDiffs) return externalDiffs;
    if (!parsedData || !parsedOtherData) return new Map<string, NodeDiff>();
    
    if (side === "left") {
      return computeDeepDiff(parsedData, parsedOtherData);
    } else {
      return computeDeepDiff(parsedOtherData, parsedData);
    }
  }, [parsedData, parsedOtherData, side, externalDiffs]);

  const handleUpdate = useCallback(
    (path: string, newValue: any) => {
      if (!onChange || typeof data !== "string") return;

      try {
        const obj = JSON.parse(data);
        const pathParts = path.split(/[.\[\]]/).filter(Boolean);
        let current = obj;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          current = current[part];
        }
        current[pathParts[pathParts.length - 1]] = newValue;
        onChange(JSON.stringify(obj, null, 2));
      } catch {
        // Failed to update
      }
    },
    [data, onChange]
  );

  // Keyboard navigation for the container
  const handleContainerKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const focusableNodes = containerRef.current?.querySelectorAll('[tabindex="0"]');
      if (!focusableNodes) return;
      
      const currentIndex = Array.from(focusableNodes).findIndex(
        (node) => node === document.activeElement
      );
      
      if (e.key === "ArrowDown" && currentIndex < focusableNodes.length - 1) {
        (focusableNodes[currentIndex + 1] as HTMLElement).focus();
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        (focusableNodes[currentIndex - 1] as HTMLElement).focus();
      }
    }
  }, []);

  if (parseError) {
    return (
      <div className={cn("p-4 rounded-lg border border-red-500/20 bg-red-500/5", className)}>
        <p className="text-red-500 text-sm font-mono">Invalid JSON: {parseError}</p>
      </div>
    );
  }

  if (parsedData === null || parsedData === undefined) {
    return (
      <div className={cn("p-4 text-muted-foreground text-sm", className)}>
        No data to display
      </div>
    );
  }

  const type = getValueType(parsedData);
  const rootDiff = nodeDiffs.get("") || nodeDiffs.get("(root)");
  const rootDiffType = rootDiff?.type || "unchanged";

  return (
    <div
      ref={containerRef}
      onKeyDown={handleContainerKeyDown}
      className={cn(
        "overflow-auto rounded-lg border border-border bg-card p-3 font-mono text-sm h-full focus:outline-none",
        className
      )}
      tabIndex={-1}
    >
      {type === "object" || type === "array" ? (
        <>
          <span className="text-muted-foreground">{type === "array" ? "[" : "{"}</span>
          <div className="ml-4 border-l border-border/50 pl-2">
            {Object.entries(parsedData).map(([key, value], index, arr) => {
              const keyPath = type === "array" ? `[${key}]` : key;
              const nodeDiff = nodeDiffs.get(keyPath);
              const diffType = nodeDiff?.type || "unchanged";
              
              return (
                <TreeNode
                  key={key}
                  keyName={type === "array" ? index : key}
                  value={value}
                  depth={1}
                  path={keyPath}
                  onUpdate={editable ? handleUpdate : undefined}
                  defaultExpanded={defaultExpanded}
                  maxDepth={maxDepth}
                  editable={editable}
                  isLast={index === arr.length - 1}
                  diffType={diffType}
                  nodeDiffs={nodeDiffs}
                  side={side}
                  isSelected={selectedPath === keyPath}
                  onSelect={setSelectedPath}
                />
              );
            })}
          </div>
          <span className="text-muted-foreground">{type === "array" ? "]" : "}"}</span>
        </>
      ) : (
        <TreeNode
          keyName={null}
          value={parsedData}
          depth={0}
          path=""
          onUpdate={editable ? handleUpdate : undefined}
          defaultExpanded={defaultExpanded}
          maxDepth={maxDepth}
          editable={editable}
          isLast={true}
          diffType={rootDiffType}
          nodeDiffs={nodeDiffs}
          side={side}
          isSelected={selectedPath === ""}
          onSelect={setSelectedPath}
        />
      )}
    </div>
  );
}
