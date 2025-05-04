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
        // Успешно получили объект JSON от API
        // Теперь нужно убедиться, что структура result.data подходит для ECharts
        // Ваша предыдущая логика парсинга была внутри API, теперь данные приходят готовыми
        // Возможно, вам нужно будет адаптировать структуру result.data к EChartsOption здесь
        // Пример: предполагаем, что result.data уже имеет нужную структуру EChartsOption
        setOption(result.data as EChartsOption);
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
