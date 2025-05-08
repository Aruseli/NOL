'use client';

import { useChartStore } from "@/store/chartStore";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from 'echarts-for-react'

export default function EChartsChart() {
  const chartOption = useChartStore((state) => state.chartOption);
  const option: EChartsOption = chartOption;
  console.log('option', option);
  console.log('chartOption', chartOption);
  return (
    <div>
      {option && <ReactECharts option={option} />}
    </div>
  );
}
