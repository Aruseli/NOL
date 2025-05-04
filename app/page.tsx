import EChartsChart from "@/components/Chart";
import Chat from "./chat";

export default function Home() {
  return (
    <main className="w-full h-screen items-center justify-items-center min-h-screen p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="grid grid-cols-[0.5fr_1fr] w-full h-full gap-2">
        <div className="border p-2 rounded-md">
          <Chat />
        </div>
        <div className="border p-2 rounded-md">
          <EChartsChart />
        </div>
      </div>
    </main>
  );
}
