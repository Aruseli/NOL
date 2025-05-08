"use client";
import { useState } from "react";
import { ChatBubble } from "@/components/ChatBubble";
import { SparkleIcon } from "@/components/SparkleIcon";
import { UploadIcon } from "@/components/UploadIcon";
import { useChartStore } from '@/store/chartStore';
import { useLoadingStore } from "@/store/loadingStore";

export default function Chat({ onFileUpload }: { onFileUpload?: (data: object) => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean}>>([]);
  const setChartOption = useChartStore((state) => state.setChartOption);
  const { showLoader, hideLoader } = useLoadingStore.getState();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessages(prev => [...prev, {text: input, isUser: true}]);
    showLoader();
    try {
      // Для JSON данных
      if (input.startsWith('{') || input.startsWith('[')) {
        const jsonData = JSON.parse(input);
        const chartResponse = await fetch('/api/chart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json' // Добавляем заголовок
          },
          body: JSON.stringify({ data: jsonData })
        });
        if (!chartResponse.ok) throw new Error('Chart API error');
      
        const result = await chartResponse.json();
        onFileUpload?.(result.data);
        setChartOption(result.data);
      } 
      // Для текстовых запросов
      else {
        const chatResponse = await fetch("/api/chat", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json' // Добавляем заголовок
          },
          body: JSON.stringify({ prompt: input })
        });
        
        if (!chatResponse.ok) {
          throw new Error('Chat API error');
        }
        
        const { text, chart } = await chatResponse.json(); // Предполагаем, что /api/chat может вернуть и 'chart'
        setMessages(prev => [...prev, {text, isUser: false}]);
        if (chart) { // Если API вернуло данные для графика
          setChartOption(chart);
        }
      }
    } catch (error) {
      console.error('Ошибка обработки запроса:', error);
      alert('Произошла ошибка при обработке данных');
    } finally {
      hideLoader();
    }
    
    setInput("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonContent = JSON.parse(event.target?.result as string);
          setInput(JSON.stringify(jsonContent, null, 2));
          
          // Добавляем сообщение о загрузке файла
          setMessages(prev => [...prev, {
            text: `Файл ${file.name} успешно загружен`,
            isUser: true
          }]);
          const chartResponse = await fetch('/api/chart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: jsonContent }) // Отправляем jsonContent
          });
          if (!chartResponse.ok) throw new Error('Chart API error from file upload');
        
          const result = await chartResponse.json();
          setChartOption(result.data);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          setMessages(prev => [...prev, {
            text: 'Ошибка: неверный формат JSON файла',
            isUser: false
          }]);
        }
      };
      reader.onerror = () => {
        setMessages(prev => [...prev, {
          text: 'Ошибка при чтении файла',
          isUser: false
        }]);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full h-full items-center grid grid-rows-[1fr_4.5em] relative pr-2">
      <div className="h-full overflow-hidden">
        <div className="flex flex-col gap-2 mb-4 overflow-y-scroll">
          {messages.map((msg, i) => (
            <div key={i} className={`whitespace-pre-wrap flex text-gray-50 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              <ChatBubble role={msg.isUser ? 'user' : 'assistant'} message={msg.text} />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 w-full pr-4">
        <form onSubmit={handleSubmit} className="flex flex-row gap-4 relative">
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer border-foreground border-2 bg-background rounded-full hover:bg-gray-200 absolute right-[1.7rem] -top-[0.7rem] p-1"
          >
            <UploadIcon />
          </label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter your message..."
            className="flex-1 wrap-anywhere"
          />
          <button type="submit"><SparkleIcon /></button>
        </form>
      </div>
    </div>
  );
}