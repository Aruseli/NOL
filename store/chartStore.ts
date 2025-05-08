import { create } from 'zustand';
import { EChartsOption } from 'echarts'; // Убедитесь, что тип EChartsOption импортирован правильно

interface ChartState {
  chartOption: EChartsOption | null; // Состояние для опций графика, может быть null изначально
  setChartOption: (option: EChartsOption | null) => void; // Функция для обновления опций
}

// Создаем хранилище Zustand
export const useChartStore = create<ChartState>((set) => ({
  chartOption: null, // Начальное значение опций графика
  setChartOption: (option) => set({ chartOption: option }), // Функция для установки новых опций
}));