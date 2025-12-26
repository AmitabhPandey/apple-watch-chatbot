"use client";

import { Message } from "@/types/chat";
import { CitationCard } from "./CitationCard";

interface ChatMessageProps {
    message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
    return (
        <div
            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
        >
            <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${message.isUser
                        ? "bg-blue-600 text-white"
                        : "bg-white/20 text-white border border-white/20"
                    }`}
            >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1" suppressHydrationWarning>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
                {!message.isUser && message.citations && message.citations.length > 0 && (
                    <CitationCard citations={message.citations} />
                )}
            </div>
        </div>
    );
};
