"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileSystemProvider } from "@/lib/contexts/file-system-context";
import { ChatProvider } from "@/lib/contexts/chat-context";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FileTree } from "@/components/editor/FileTree";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderActions } from "@/components/HeaderActions";

interface MainContentProps {
  user?: {
    id: string;
    email: string;
  } | null;
  project?: {
    id: string;
    name: string;
    messages: any[];
    data: any;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function MainContent({ user, project }: MainContentProps) {
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");

  return (
    <FileSystemProvider initialData={project?.data}>
      <ChatProvider projectId={project?.id} initialMessages={project?.messages}>
        <div className="h-screen w-screen overflow-hidden bg-background">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Chat */}
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="z-10">
              <div className="h-full flex flex-col bg-white/50 backdrop-blur-md border-r border-border/40">
                {/* Chat Header */}
                <div className="h-16 flex items-center px-8 border-b border-border/40 bg-white/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl premium-gradient flex items-center justify-center shadow-lg shadow-brand-primary/20">
                      <div className="w-4 h-4 rounded-full bg-white/20 backdrop-blur-sm animate-pulse" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500 tracking-tight">
                      UIGen
                    </h1>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="flex-1 overflow-hidden">
                  <ChatInterface />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-[1px] bg-border/40 hover:bg-brand-primary/30 transition-all duration-300" />

            {/* Right Panel - Preview/Code */}
            <ResizablePanel defaultSize={65}>
              <div className="h-full flex flex-col bg-background">
                {/* Top Bar */}
                <div className="h-16 border-b border-border/40 px-8 flex items-center justify-between glass sticky top-0 z-20">
                  <Tabs
                    value={activeView}
                    onValueChange={(v) =>
                      setActiveView(v as "preview" | "code")
                    }
                    className="w-auto"
                  >
                    <TabsList className="bg-neutral-100/50 border border-border/40 p-1 h-10 shadow-inner rounded-xl">
                      <TabsTrigger 
                        value="preview" 
                        className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-neutral-500 px-6 py-1.5 text-sm font-semibold rounded-lg transition-all"
                      >
                        Preview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="code" 
                        className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-neutral-500 px-6 py-1.5 text-sm font-semibold rounded-lg transition-all"
                      >
                        Code
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <HeaderActions user={user} projectId={project?.id} />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative">
                  {/* Background Decoration */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
                    <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-accent/5 rounded-full blur-[100px]" />
                  </div>

                  {activeView === "preview" ? (
                    <div className="h-full bg-transparent p-6">
                      <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/5 border border-border/40 bg-white">
                        <PreviewFrame />
                      </div>
                    </div>
                  ) : (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full"
                    >
                      {/* File Tree */}
                      <ResizablePanel
                        defaultSize={25}
                        minSize={20}
                        maxSize={40}
                      >
                        <div className="h-full bg-neutral-50/50 backdrop-blur-sm border-r border-border/40">
                          <FileTree />
                        </div>
                      </ResizablePanel>

                      <ResizableHandle className="w-[1px] bg-border/40 hover:bg-brand-primary/30 transition-all duration-300" />

                      {/* Code Editor */}
                      <ResizablePanel defaultSize={75}>
                        <div className="h-full bg-white/80 backdrop-blur-sm">
                          <CodeEditor />
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </ChatProvider>
    </FileSystemProvider>
  );
}
