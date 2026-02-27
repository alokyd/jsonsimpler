"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  createContext,
  useContext,
  RefObject,
} from "react";
import {
  Panel,
  Group,
  Separator,
  PanelImperativeHandle,
} from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, GripVertical, GripHorizontal, GitCompare, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Context for sharing fullscreen state
interface EditorLayoutContextType {
  fullscreenPanel: "left" | "right" | "both" | null;
  setFullscreenPanel: (panel: "left" | "right" | "both" | null) => void;
  isMobile: boolean;
  mobileActivePanel: "left" | "right";
  setMobileActivePanel: (panel: "left" | "right") => void;
  unifiedFullscreen: boolean;
  onCompare?: () => void;
}

const EditorLayoutContext = createContext<EditorLayoutContextType | null>(null);

function useEditorLayout() {
  const context = useContext(EditorLayoutContext);
  if (!context) {
    throw new Error("useEditorLayout must be used within ResizableEditorLayout");
  }
  return context;
}

// Panel Header with fullscreen toggle
interface PanelHeaderProps {
  label: string;
  panelId: "left" | "right";
  children?: ReactNode;
  hideFullscreenButton?: boolean;
}

function PanelHeader({ label, panelId, children, hideFullscreenButton }: PanelHeaderProps) {
  const { fullscreenPanel, setFullscreenPanel, isMobile, unifiedFullscreen } = useEditorLayout();
  const isFullscreen = fullscreenPanel === panelId || fullscreenPanel === "both";

  const toggleFullscreen = useCallback(() => {
    if (unifiedFullscreen) {
      setFullscreenPanel(fullscreenPanel === "both" ? null : "both");
    } else {
      setFullscreenPanel(isFullscreen ? null : panelId);
    }
  }, [isFullscreen, panelId, setFullscreenPanel, unifiedFullscreen, fullscreenPanel]);

  // Hide button if unified mode and this is the right panel (button only on left)
  const showButton = !isMobile && !hideFullscreenButton && !(unifiedFullscreen && panelId === "right");

  return (
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        {children}
        {showButton && (
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
        )}
      </div>
    </div>
  );
}

// Resize Handle component
interface ResizeHandleProps {
  direction?: "horizontal" | "vertical";
}

function ResizeHandle({ direction = "horizontal" }: ResizeHandleProps) {
  return (
    <Separator
      className={cn(
        "relative flex items-center justify-center transition-colors duration-200 bg-transparent",
        "hover:bg-blue-500/20 data-[dragging]:bg-blue-500/30",
        direction === "horizontal" ? "w-3" : "h-3"
      )}
    >
      <div
        className={cn(
          "rounded-full bg-border transition-all duration-200",
          direction === "horizontal" ? "h-8 w-1" : "w-8 h-1"
        )}
      />
      <div
        className={cn(
          "absolute flex items-center justify-center rounded bg-muted border border-border shadow-sm",
          direction === "horizontal" ? "w-4 h-8" : "h-4 w-8"
        )}
      >
        {direction === "horizontal" ? (
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        ) : (
          <GripHorizontal className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    </Separator>
  );
}

// Mobile Toggle Button
function MobileToggle() {
  const { mobileActivePanel, setMobileActivePanel } = useEditorLayout();

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mb-4">
      <button
        onClick={() => setMobileActivePanel("left")}
        className={cn(
          "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
          mobileActivePanel === "left"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Input
      </button>
      <button
        onClick={() => setMobileActivePanel("right")}
        className={cn(
          "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
          mobileActivePanel === "right"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Output
      </button>
    </div>
  );
}

// Fullscreen Toolbar Component
function FullscreenToolbar() {
  const { setFullscreenPanel, onCompare, unifiedFullscreen } = useEditorLayout();

  return (
    <div className="shrink-0 flex items-center justify-between mb-4 pb-3 border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Fullscreen Mode</span>
      </div>
      <div className="flex items-center gap-2">
        {unifiedFullscreen && onCompare && (
          <Button
            onClick={onCompare}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
          >
            <GitCompare className="h-4 w-4 mr-1.5" />
            Compare
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFullscreenPanel(null)}
        >
          <X className="h-4 w-4 mr-1.5" />
          Exit Fullscreen
        </Button>
      </div>
    </div>
  );
}

// Main Layout Props
interface ResizableEditorLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  leftLabel?: string;
  rightLabel?: string;
  leftHeaderExtra?: ReactNode;
  rightHeaderExtra?: ReactNode;
  defaultLeftSize?: number;
  minLeftSize?: number;
  minRightSize?: number;
  height?: string;
  className?: string;
  unifiedFullscreen?: boolean;
  onCompare?: () => void;
}

export function ResizableEditorLayout({
  leftPanel,
  rightPanel,
  leftLabel = "Input",
  rightLabel = "Output",
  leftHeaderExtra,
  rightHeaderExtra,
  defaultLeftSize = 50,
  minLeftSize = 20,
  minRightSize = 20,
  height = "500px",
  className,
  unifiedFullscreen = false,
  onCompare,
}: ResizableEditorLayoutProps) {
  const [fullscreenPanel, setFullscreenPanel] = useState<"left" | "right" | "both" | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<"left" | "right">("left");
  const leftPanelRef = useRef<PanelImperativeHandle | null>(null);
  const rightPanelRef = useRef<PanelImperativeHandle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreenPanel) {
        setFullscreenPanel(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenPanel]);

  // Handle fullscreen panel changes
  useEffect(() => {
    if (fullscreenPanel === "both") {
      // Unified fullscreen - both panels visible at 50-50
      leftPanelRef.current?.expand();
      rightPanelRef.current?.expand();
      leftPanelRef.current?.resize("50%");
    } else if (fullscreenPanel === "left") {
      rightPanelRef.current?.collapse();
      leftPanelRef.current?.expand();
      leftPanelRef.current?.resize("100%");
    } else if (fullscreenPanel === "right") {
      leftPanelRef.current?.collapse();
      rightPanelRef.current?.expand();
      rightPanelRef.current?.resize("100%");
    } else {
      leftPanelRef.current?.expand();
      rightPanelRef.current?.expand();
      leftPanelRef.current?.resize(`${defaultLeftSize}%`);
    }

    // Force Monaco to recalculate layout after fullscreen change
    // Dispatch resize event with small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);

    return () => clearTimeout(timer);
  }, [fullscreenPanel, defaultLeftSize]);

  const contextValue: EditorLayoutContextType = {
    fullscreenPanel,
    setFullscreenPanel,
    isMobile,
    mobileActivePanel,
    setMobileActivePanel,
    unifiedFullscreen,
    onCompare,
  };

  // Check if any fullscreen mode is active
  const isAnyFullscreen = fullscreenPanel !== null;

  // Fullscreen overlay styles - must use flex-col and h-screen for Monaco to fill height
  const fullscreenStyles = fullscreenPanel
    ? "fixed inset-0 z-50 h-screen w-screen flex flex-col bg-background p-4 md:p-6 overflow-hidden"
    : "";

  // Mobile layout
  if (isMobile) {
    return (
      <EditorLayoutContext.Provider value={contextValue}>
        <div className={cn("relative", className)}>
          <MobileToggle />

          {/* Left Panel (Input) - Mobile */}
          <div
            className={cn(
              "transition-all duration-300 ease-in-out",
              mobileActivePanel === "left"
                ? "opacity-100 visible"
                : "opacity-0 invisible absolute inset-0 pointer-events-none",
              fullscreenPanel === "left" && fullscreenStyles
            )}
          >
            <PanelHeader label={leftLabel} panelId="left">
              {leftHeaderExtra}
            </PanelHeader>
            <div className={fullscreenPanel === "left" ? "flex-1 min-h-0" : ""} style={fullscreenPanel === "left" ? undefined : { height }}>
              {leftPanel}
            </div>
            {fullscreenPanel === "left" && (
              <div className="shrink-0 mt-4 text-center text-sm text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd> to
                exit fullscreen
              </div>
            )}
          </div>

          {/* Right Panel (Output) - Mobile */}
          <div
            className={cn(
              "transition-all duration-300 ease-in-out",
              mobileActivePanel === "right"
                ? "opacity-100 visible"
                : "opacity-0 invisible absolute inset-0 pointer-events-none",
              fullscreenPanel === "right" && fullscreenStyles
            )}
          >
            <PanelHeader label={rightLabel} panelId="right">
              {rightHeaderExtra}
            </PanelHeader>
            <div className={fullscreenPanel === "right" ? "flex-1 min-h-0" : ""} style={fullscreenPanel === "right" ? undefined : { height }}>
              {rightPanel}
            </div>
            {fullscreenPanel === "right" && (
              <div className="shrink-0 mt-4 text-center text-sm text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd> to
                exit fullscreen
              </div>
            )}
          </div>
        </div>
      </EditorLayoutContext.Provider>
    );
  }

  // Desktop layout with resizable panels
  return (
    <EditorLayoutContext.Provider value={contextValue}>
      {/* Fullscreen overlay - renders at document root level */}
      {isAnyFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col overflow-hidden">
          <div className="flex flex-col h-full w-full p-4 md:p-6">
            {/* Fullscreen Toolbar */}
            <FullscreenToolbar />
            
            {/* Fullscreen Content */}
            <div className="flex-1 min-h-0">
              <Group orientation="horizontal" className="h-full rounded-lg">
                {/* Left Panel - Fullscreen */}
                <Panel
                  id="fs-left-panel"
                  defaultSize={fullscreenPanel === "right" ? "0%" : "50%"}
                  minSize={fullscreenPanel === "right" ? "0%" : "20%"}
                  collapsible={fullscreenPanel === "right"}
                  collapsedSize="0%"
                  className={cn(
                    "transition-all duration-200",
                    fullscreenPanel === "right" && "opacity-0"
                  )}
                >
                  <div className="pr-2 flex flex-col h-full">
                    <PanelHeader label={leftLabel} panelId="left" hideFullscreenButton>
                      {leftHeaderExtra}
                    </PanelHeader>
                    <div className="flex-1 min-h-0">
                      {leftPanel}
                    </div>
                  </div>
                </Panel>

                {/* Resize Handle - Fullscreen */}
                {fullscreenPanel === "both" && <ResizeHandle direction="horizontal" />}

                {/* Right Panel - Fullscreen */}
                <Panel
                  id="fs-right-panel"
                  defaultSize={fullscreenPanel === "left" ? "0%" : "50%"}
                  minSize={fullscreenPanel === "left" ? "0%" : "20%"}
                  collapsible={fullscreenPanel === "left"}
                  collapsedSize="0%"
                  className={cn(
                    "transition-all duration-200",
                    fullscreenPanel === "left" && "opacity-0"
                  )}
                >
                  <div className="pl-2 flex flex-col h-full">
                    <PanelHeader label={rightLabel} panelId="right" hideFullscreenButton>
                      {rightHeaderExtra}
                    </PanelHeader>
                    <div className="flex-1 min-h-0">
                      {rightPanel}
                    </div>
                  </div>
                </Panel>
              </Group>
            </div>

            {/* Fullscreen exit hint */}
            <div className="shrink-0 mt-4 text-center text-sm text-muted-foreground">
              Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd> to exit fullscreen
            </div>
          </div>
        </div>
      )}

      {/* Normal layout (non-fullscreen) */}
      <div
        ref={containerRef}
        className={cn(
          "relative group",
          className
        )}
      >
        <Group orientation="horizontal" className="rounded-lg">
          {/* Left Panel */}
          <Panel
            id="left-panel"
            panelRef={leftPanelRef as RefObject<PanelImperativeHandle | null>}
            defaultSize={fullscreenPanel === "right" ? "0%" : fullscreenPanel === "both" ? "50%" : `${defaultLeftSize}%`}
            minSize={fullscreenPanel && fullscreenPanel !== "both" ? "0%" : `${minLeftSize}%`}
            collapsible={fullscreenPanel === "left" || fullscreenPanel === "right"}
            collapsedSize="0%"
            className={cn(
              "transition-all duration-200",
              fullscreenPanel === "right" && "opacity-0"
            )}
          >
            <div className={cn("pr-2 flex flex-col", isAnyFullscreen ? "h-full" : "")}>
              <PanelHeader label={leftLabel} panelId="left">
                {leftHeaderExtra}
              </PanelHeader>
              <div className={(fullscreenPanel === "left" || fullscreenPanel === "both") ? "flex-1 min-h-0" : ""} style={(fullscreenPanel === "left" || fullscreenPanel === "both") ? undefined : { height }}>
                {leftPanel}
              </div>
            </div>
          </Panel>

          {/* Resize Handle */}
          {(!fullscreenPanel || fullscreenPanel === "both") && <ResizeHandle direction="horizontal" />}

          {/* Right Panel */}
          <Panel
            id="right-panel"
            panelRef={rightPanelRef as RefObject<PanelImperativeHandle | null>}
            defaultSize={fullscreenPanel === "left" ? "0%" : fullscreenPanel === "both" ? "50%" : `${100 - defaultLeftSize}%`}
            minSize={fullscreenPanel && fullscreenPanel !== "both" ? "0%" : `${minRightSize}%`}
            collapsible={fullscreenPanel === "left" || fullscreenPanel === "right"}
            collapsedSize="0%"
            className={cn(
              "transition-all duration-200",
              fullscreenPanel === "left" && "opacity-0"
            )}
          >
            <div className={cn("pl-2 flex flex-col", isAnyFullscreen ? "h-full" : "")}>
              <PanelHeader label={rightLabel} panelId="right">
                {rightHeaderExtra}
              </PanelHeader>
              <div className={(fullscreenPanel === "right" || fullscreenPanel === "both") ? "flex-1 min-h-0" : ""} style={(fullscreenPanel === "right" || fullscreenPanel === "both") ? undefined : { height }}>
                {rightPanel}
              </div>
            </div>
          </Panel>
        </Group>
      </div>
    </EditorLayoutContext.Provider>
  );
}

// Export sub-components for flexibility
export { PanelHeader, ResizeHandle, MobileToggle };
