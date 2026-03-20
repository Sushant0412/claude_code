import { Loader2 } from "lucide-react";

export interface ToolInvocationProps {
  tool: {
    toolName: string;
    state: string;
    result?: any;
    args?: any;
  };
}

export function ToolInvocation({ tool }: ToolInvocationProps) {
  let message = tool.toolName;
  
  let args = tool.args;
  if (typeof args === "string") {
    try {
      args = JSON.parse(args);
    } catch (e) {
      // Ignore
    }
  }

  if (tool.toolName === "str_replace_editor" && args) {
    if (args.command === "create" && args.path) {
      message = `Creating file: ${args.path}`;
    } else if (args.command === "str_replace" && args.path) {
      message = `Editing file: ${args.path}`;
    } else if (args.path) {
      message = `Modifying file: ${args.path}`;
    }
  }

  const isComplete = tool.state === "result" || tool.state === "success";

  return (
    <div className="w-full mt-3 group">
      <div className="flex items-center gap-3 p-3 bg-secondary/30 hover:bg-secondary/50 rounded-xl border border-border/50 transition-all duration-200">
        <div className="flex-shrink-0">
          {isComplete ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[13px] font-medium text-foreground/90 truncate">
            {message}
          </span>
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
            {tool.state === "call" ? "Executing task..." : "Task complete"}
          </span>
        </div>
      </div>
    </div>
  );
}
