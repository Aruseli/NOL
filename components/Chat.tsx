"use client";
import { useState } from "react";
import { ChatBubble } from "@/components/ChatBubble";
import { SparkleIcon } from "@/components/Icons/SparkleIcon";
import { UploadIcon } from "@/components/Icons/UploadIcon";
import { useChartStore } from '@/store/chartStore';
import { useLoadingStore } from "@/store/loadingStore";
import { DocumentIcon } from "./Icons/DocumentIcon";
import { IconButton } from "./IconButton";
import { CloseIcon } from "./Icons/CloseIcon";

export const Chat = ({ onFileUpload }: { onFileUpload?: (data: object) => void }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean}>>([]);
  const [fileInfo, setFileInfo] = useState<{ name: string, content: string } | null>(null);
  const setChartOption = useChartStore((state) => state.setChartOption);
  const { showLoader, hideLoader } = useLoadingStore.getState();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let promptToSend: string;
    let messageForChat: string;
    const userTextInput = input.trim();

    if (fileInfo) {
      // Файл загружен
      if (userTextInput) {
        // Файл загружен И есть текст в textarea
        promptToSend = `Данные из файла "${fileInfo.name}":\n${fileInfo.content}\n\nИнструкция от пользователя к этим данным:\n${userTextInput}`;
        messageForChat = `Файл: ${fileInfo.name}\nИнструкция: ${userTextInput}`;
      } else {
        // Файл загружен, но textarea пусто. Отправляем только содержимое файла.
        // (Можно добавить более описательный промпт по умолчанию, если это необходимо)
        promptToSend = fileInfo.content; 
        messageForChat = `Файл: ${fileInfo.name}`;
      }
    } else if (userTextInput) {
      // Файл не загружен, только текст в textarea
      promptToSend = userTextInput;
      messageForChat = userTextInput;
    } else {
      // Нечего отправлять (ни файла, ни текста)
      return; 
    }

    setMessages(prev => [...prev, { text: messageForChat, isUser: true }]);
    showLoader();

    try {
      // Всегда используем /api/chat, который вызывает оба LLM инструмента
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: promptToSend })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ details: 'Unknown API error' }));
        throw new Error(`API error: ${response.status} ${response.statusText}. ${errorData.details || ''}`);
      }
      
      const { text, chart } = await response.json();
      setMessages(prev => [...prev, {text, isUser: false}]);
      if (chart) {
        // Проверяем, является ли 'chart' объектом и не null (т.е. валидной конфигурацией)
        if (typeof chart === 'object' && chart !== null) {
          setChartOption(chart);
          onFileUpload?.(chart); // Обновляем график, если есть валидные данные
        } else {
          // Если 'chart' - это строка ошибки или что-то иное, обрабатываем как ошибку
          console.error('Ошибка при получении данных для диаграммы:', chart);
          setMessages(prev => [...prev, { text: `Не удалось построить диаграмму: ${typeof chart === 'string' ? chart : 'некорректные данные'}`, isUser: false }]);
          setChartOption(null); // Сбрасываем опции диаграммы или устанавливаем состояние ошибки
        }
      } else {
        setChartOption(null); // Если chart пустой, также сбрасываем
      }
    } catch (error) {
      console.error('Ошибка обработки запроса:', error);
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при обработке данных';
      setMessages(prev => [...prev, { text: `Ошибка: ${errorMessage}`, isUser: false }]);
    } finally {
      hideLoader();
    }
    
    setInput(""); // Очищаем текстовое поле
    if (fileInfo) {
      setFileInfo(null); // Очищаем информацию о файле после отправки
    }
    
    // setInput("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContentString = event.target?.result as string;
        if (typeof fileContentString === 'string') {
          setFileInfo({ name: file.name, content: fileContentString });
          setInput(""); // Очищаем текстовое поле, так как файл выбран
          setMessages(prev => [...prev, {
            text: `Загружен файл: ${file.name}. Нажмите "Отправить" для обработки.`,
            isUser: true 
          }]);
        } else {
          setMessages(prev => [...prev, { text: 'Не удалось прочитать содержимое файла.', isUser: false }]);
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
        <div className="flex flex-col gap-2 mb-4 overflow-y-scroll h-full">
          {messages.map((msg, i) => (
            <div key={i} className={`whitespace-pre-wrap flex text-gray-50 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              <ChatBubble role={msg.isUser ? 'user' : 'assistant'} message={msg.text} />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 w-full pr-4">
        <form onSubmit={handleSubmit} className="flex flex-row gap-4 relative">
          {fileInfo && (
            <div className="flex flex-row items-center justify-between p-2 border rounded-md bg-background relative">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate" title={fileInfo.name}>{fileInfo.name}</span>
                <DocumentIcon />
              </div>
              <div className="absolute -top-2 -right-2 bg-background size-5 flex items-center justify-center">
                <IconButton
                  onClick={() => {
                    const clearedFileName = fileInfo.name;
                    setFileInfo(null);
                    setMessages(prev => [...prev, { text: `Выбор файла ${clearedFileName} отменен.`, isUser: true }]);
                  }}
                  ariaLabel="Clear file"
                  className="rounded-full hover:bg-gray-200"
                  icon={<CloseIcon className="size-4" />}
                />
              </div>
            </div>
          )}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Введите текстовый запрос или загрузите файл..."
            className="flex-1 wrap-anywhere min-h-[40px] p-2 border rounded-md" // Добавлены стили для textarea
            rows={2}
          />
          <input
            type="file"
            accept=".txt,.json,application/json,text/plain"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="p-0.5 cursor-pointer bg-background rounded-full hover:bg-gray-200 absolute right-[2.2rem] -top-[0.1rem]"
          >
            <UploadIcon />
          </label>
          <IconButton
            icon={<SparkleIcon />}
            ariaLabel="Send"
            type="submit" 
            disabled={!input.trim() && !fileInfo}
          />
        </form>
      </div>
    </div>
  );
}
