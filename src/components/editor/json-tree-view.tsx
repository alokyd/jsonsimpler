"use client";

import { useState, useCallback, useMemo } from "react";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonTreeViewProps {
  data: any;
  onChange?: (newData: any) => void;
  className?: string;
  defaultExpanded?: boolean;
  maxDepth?: number;
  editable?: boolean;
}

interface TreeNodeProps {
  keyName: string | number | null;
  value: any;
  depth: number;
  path: string[];
  onUpdate?: (path: string[], newValue: any) => void;
  defaultExpanded: boolean;
  maxDepth: number;
  editable: boolean;
  isLast: boolean;
}

function getValueType(value: any): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function getValueColor(type: string): string {
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
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded && depth < maxDepth);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [copied, setCopied] = useState(false);

  const type = getValueType(value);
  const isExpandable = type === "object" || type === "array";
  const childCount = isExpandable ? Object.keys(value || {}).length : 0;

  const handleToggle = useCallback(() => {
    if (isExpandable) {
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
      // Invalid JSON, keep as string
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

    switch (type) {
      case "string":
        return (
          <span className={cn("font-mono text-sm", getValueColor(type))}>
            &quot;{value}&quot;
          </span>
        );
      case "number":
      case "boolean":
        return (
          <span className={cn("font-mono text-sm", getValueColor(type))}>
            {String(value)}
          </span>
        );
      case "null":
        return (
          <span className={cn("font-mono text-sm italic", getValueColor(type))}>
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
        {entries.map(([childKey, childValue], index) => (
          <TreeNode
            key={childKey}
            keyName={type === "array" ? index : childKey}
            value={childValue}
            depth={depth + 1}
            path={[...path, childKey]}
            onUpdate={onUpdate}
            defaultExpanded={defaultExpanded}
            maxDepth={maxDepth}
            editable={editable}
            isLast={index === entries.length - 1}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1 py-0.5 px-1 rounded-sm hover:bg-muted/50 group",
          isExpandable && "cursor-pointer"
        )}
        onClick={handleToggle}
        onDoubleClick={handleDoubleClick}
      >
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
            <span className="font-mono text-sm text-violet-600 dark:text-violet-400">
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

export function JsonTreeView({
  data,
  onChange,
  className,
  defaultExpanded = true,
  maxDepth = 10,
  editable = false,
}: JsonTreeViewProps) {
  const [parseError, setParseError] = useState<string | null>(null);

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

  const handleUpdate = useCallback(
    (path: string[], newValue: any) => {
      if (!onChange || typeof data !== "string") return;

      try {
        const obj = JSON.parse(data);
        let current = obj;
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        current[path[path.length - 1]] = newValue;
        onChange(JSON.stringify(obj, null, 2));
      } catch {
        // Failed to update
      }
    },
    [data, onChange]
  );

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

  return (
    <div
      className={cn(
        "overflow-auto rounded-lg border border-border bg-card p-3 font-mono text-sm h-full",
        className
      )}
    >
      {type === "object" || type === "array" ? (
        <>
          <span className="text-muted-foreground">{type === "array" ? "[" : "{"}</span>
          <div className="ml-4 border-l border-border/50 pl-2">
            {Object.entries(parsedData).map(([key, value], index, arr) => (
              <TreeNode
                key={key}
                keyName={type === "array" ? index : key}
                value={value}
                depth={1}
                path={[key]}
                onUpdate={editable ? handleUpdate : undefined}
                defaultExpanded={defaultExpanded}
                maxDepth={maxDepth}
                editable={editable}
                isLast={index === arr.length - 1}
              />
            ))}
          </div>
          <span className="text-muted-foreground">{type === "array" ? "]" : "}"}</span>
        </>
      ) : (
        <TreeNode
          keyName={null}
          value={parsedData}
          depth={0}
          path={[]}
          onUpdate={editable ? handleUpdate : undefined}
          defaultExpanded={defaultExpanded}
          maxDepth={maxDepth}
          editable={editable}
          isLast={true}
        />
      )}
    </div>
  );
}
