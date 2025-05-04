'use client';

import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { EChartsOption } from 'echarts';

export default function EChartsChart() {
  const [option, setOption] = useState<EChartsOption | null>(null);
  const [error, setError] = useState<string | null>(null); // Состояние для ошибки
  const [isLoading, setIsLoading] = useState<boolean>(false); // Состояние загрузки

  const fetchChartData = async (prompt: string) => {
    setIsLoading(true); // Начинаем загрузку
    setError(null); // Сбрасываем предыдущую ошибку
    setOption(null); // Сбрасываем предыдущий график

    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        body: JSON.stringify({ prompt }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json();

      if (!res.ok) {
        // Если статус ответа не 2xx, считаем это ошибкой
        throw new Error(result.error || `HTTP error! status: ${res.status}`);
      }

      // Проверяем, есть ли поле data (успешный ответ от API)
      if (result.data && typeof result.data === 'object') {
        // --- Add validation ---
        if (typeof result.data === 'object' && result.data !== null && Array.isArray((result.data as any).series)) {
          // Looks like a plausible ECharts option
          setOption(result.data as EChartsOption);
        } else {
          // Data received, but not a valid ECharts structure
          console.error("Invalid ECharts option structure received:", result.data);
          throw new Error("Received data is not a valid ECharts configuration object. Ensure it has a 'series' array.");
        }
        // --- End validation ---
      } else {
        // Если data нет или это не объект, что-то пошло не так
        throw new Error(result.error || result.details || "Некорректный формат данных от API");
      }

    } catch (e) {
      console.error("Ошибка при получении или обработке данных графика:", e);
      setError(e instanceof Error ? e.message : "Произошла неизвестная ошибка");
      setOption(null); // Убедимся, что график не отображается при ошибке
    } finally {
      setIsLoading(false); // Заканчиваем загрузку
    }
  };

  return (
    <div>
      <button onClick={() => fetchChartData("Построй график продаж по месяцам")} disabled={isLoading}>
        {isLoading ? "Загрузка..." : "Построить график"}
      </button>
      {isLoading && <div>Загрузка данных...</div>}
      {error && <div style={{ color: 'red' }}>Ошибка: {error}</div>}
      {/* Отображаем график только если есть опции и нет ошибки */}
      {option && !error && <ReactECharts option={option} />}
    </div>
  );
}
