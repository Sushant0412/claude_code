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

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200" data-testid="tool-invocation">
      {tool.state === "result" || tool.state === "success" ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" data-testid="status-indicator-success"></div>
          <span className="text-neutral-700 font-sans">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" data-testid="status-indicator-loading" />
          <span className="text-neutral-700 font-sans">{message}</span>
        </>
      )}
    </div>
  );
}
