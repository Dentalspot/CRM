import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("flex max-w-[85%] md:max-w-[75%]", isUser ? "flex-row-reverse" : "flex-row")}>
        
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm mt-1",
          isUser ? "ml-2 bg-primary text-white" : "mr-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
        )}>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed",
            isUser 
              ? "bg-primary text-primary-foreground rounded-tr-none" 
              : isError
                ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-none"
                : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
          
          <span className={cn(
            "text-[10px] block mt-1 opacity-70",
            isUser ? "text-right text-primary-foreground/80" : "text-left text-gray-400"
          )}>
            {format(new Date(message.timestamp), 'HH:mm', { locale: es })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;