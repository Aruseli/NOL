"use client";
import { useState } from "react";
import { ChatBubble } from "@/components/ChatBubble";
import { SparkleIcon } from "@/components/SparkleIcon";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean}>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setMessages(prev => [...prev, {text: input, isUser: true}]);
    
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ prompt: input })
    });
    
    const { text } = await response.json();
    setMessages(prev => [...prev, {text, isUser: false}]);
    setInput("");
  };

  return (
    <div className="w-full h-full items-center grid grid-rows-[1fr_4.5em] relative">
      <div className="flex flex-col gap-2 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`whitespace-pre-wrap flex text-gray-50 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <ChatBubble role={msg.isUser ? 'user' : 'assistant'} message={msg.text} />
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-row gap-4 absolute bottom-4 w-full">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter your message..."
        />
        <button type="submit"><SparkleIcon /></button>
      </form>
    </div>
  );
}