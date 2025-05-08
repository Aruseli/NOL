'use client';

import ReactECharts from "echarts-for-react";
import { EChartsOption } from 'echarts';

export default function EChartsChart(option: EChartsOption) {
  console.log('option', option);
  const chartOption = option.option ? option.option : option;
  return (
    <div>
      {option && <ReactECharts option={chartOption} />}
    </div>
  );
}
