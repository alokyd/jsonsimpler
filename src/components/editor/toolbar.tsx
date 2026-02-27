"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Trash2, Upload } from "lucide-react";

interface ToolbarProps {
    onCopy?: () => void;
    onDownload?: () => void;
    onClear?: () => void;
    onUpload?: (content: string) => void;
    copyLabel?: string;
    downloadFilename?: string;
    downloadContent?: string;
    children?: React.ReactNode;
}

export function Toolbar({
    onCopy,
    onDownload,
    onClear,
    onUpload,
    copyLabel = "Copy",
    downloadFilename = "output.json",
    downloadContent,
    children,
}: ToolbarProps) {
    const handleUpload = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,.csv,.xml,.yaml,.yml,.txt";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    onUpload?.(ev.target?.result as string);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }, [onUpload]);

    const handleDownload = useCallback(() => {
        if (downloadContent) {
            const blob = new Blob([downloadContent], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = downloadFilename;
            a.click();
            URL.revokeObjectURL(url);
        }
        onDownload?.();
    }, [downloadContent, downloadFilename, onDownload]);

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {children}
            {onUpload && (
                <Button variant="outline" size="sm" onClick={handleUpload}>
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Upload
                </Button>
            )}
            {(onCopy || downloadContent) && (
                <Button variant="outline" size="sm" onClick={onCopy}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    {copyLabel}
                </Button>
            )}
            {(onDownload || downloadContent) && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download
                </Button>
            )}
            {onClear && (
                <Button variant="outline" size="sm" onClick={onClear}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Clear
                </Button>
            )}
        </div>
    );
}
