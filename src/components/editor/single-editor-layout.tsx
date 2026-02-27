"use client";

import {
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SingleEditorLayoutProps {
  editor: ReactNode;
  label?: string;
  headerExtra?: ReactNode;
  height?: string;
  className?: string;
}

export function SingleEditorLayout({
  editor,
  label = "Editor",
  headerExtra,
  height = "500px",
  className,
}: SingleEditorLayoutProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Force Monaco to recalculate layout after fullscreen change
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);

    return () => clearTimeout(timer);
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <div
      className={cn(
        "relative",
        isFullscreen && "fixed inset-0 z-50 h-screen w-screen flex flex-col bg-background p-4 md:p-6 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="flex items-center gap-2">
          {headerExtra}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor Container */}
      <div
        className={isFullscreen ? "flex-1 min-h-0" : ""}
        style={isFullscreen ? undefined : { height }}
      >
        {editor}
      </div>

      {/* Fullscreen exit hint */}
      {isFullscreen && (
        <div className="shrink-0 mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/90 backdrop-blur-sm rounded-full border border-border shadow-lg text-sm text-muted-foreground">
            Press{" "}
            <kbd className="px-2 py-0.5 bg-background rounded text-xs font-mono">
              Esc
            </kbd>{" "}
            to exit fullscreen
          </div>
        </div>
      )}
    </div>
  );
}
