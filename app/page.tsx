'use client';
import { EChartsChart } from "@/components/Chart";
import { Chat } from "@/components/Chat";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Spinner } from "@/components/Spinner";

export default function Home() {
  
  return (
    <main className="w-screen h-screen items-center justify-items-center min-h-screen p-4 font-[family-name:var(--font-geist-sans)]">
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border p-4">
        <ResizablePanel>
          <div className="w-full h-full">
            <Chat />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <div className="w-full h-full relative">
            <Spinner />
            <EChartsChart />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
