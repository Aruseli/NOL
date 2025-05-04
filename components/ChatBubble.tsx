'use client';

import { useState } from 'react';
import { CopyIcon } from '@/components/CopyIcon';
import { IconButton } from '@/components/IconButton';
import { SparkleIcon } from './SparkleIcon';
import { UserIcon } from './UserIcon';

interface ChatBubbleProps {
  message: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  className?: string;
  [key: string]: any;
}

export const ChatBubble = ({ message, role, className, ...props }: ChatBubbleProps) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  return (
    <div className={`shadow-md rounded-lg p-2 flex-col flex relative min-w-[12em] ${role === 'user' ? 'bg-gradient-to-tr from-slate-400 to-slate-800' : 'bg-gradient-to-tl from-slate-400 to-slate-800'} ${className}`} {...props}>
      <div className="flex items-center mb-2">
        {role === 'assistant' ? <div className="size-4 bg-transparent rounded-md"><SparkleIcon /></div> : <UserIcon />}
        <div className='flex w-full justify-end'>
          <IconButton icon={<CopyIcon />} ariaLabel="Copy" onClick={copyToClipboard} />
        </div>
      </div>
      {copied && (
        <div className='absolute top-0 left-0 w-full h-full bg-gray-300 opacity-70 flex items-center justify-center transition-all duration-300 ease-in-out transform scale-100 rounded-lg'>
          <span className="text-violet-950 font-bold">Copied!</span>
        </div>
      )}
      {message}
    </div>
  )
}