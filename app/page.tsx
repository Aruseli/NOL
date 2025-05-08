'use client';
import EChartsChart from "@/components/Chart";
import Chat from "./chat";
import { useChartStore } from '@/store/chartStore';

export default function Home() {
  const chartOption = useChartStore((state) => state.chartOption);
  console.log('chartOption', chartOption);
  return (
    <main className="w-screen h-screen items-center justify-items-center min-h-screen p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="grid grid-cols-[0.5fr_1fr] w-screen h-full gap-2">
        <div className="border p-2 rounded-md">
          <Chat />
        </div>
        <div className="border p-2 rounded-md w-full">
          <EChartsChart chartOption={chartOption} />
        </div>
      </div>
    </main>
  );
}
