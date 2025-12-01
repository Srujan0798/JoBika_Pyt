"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2, Sparkles, History, MessageSquare } from "lucide-react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/config";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

let socket: any;

export default function CoachPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm Orion, your AI Career Coach. I can help you with interview prep, resume tips, or career advice. How can I assist you today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize Socket.io connection
        socket = io(API_BASE_URL);

        socket.on("connect", () => {
            console.log("Connected to Orion Coach Server");
        });

        socket.on("chat:stream", (data: { chunk: string }) => {
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg.role === 'assistant' && lastMsg.id === 'streaming') {
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: lastMsg.content + data.chunk }
                    ];
                } else {
                    return [
                        ...prev,
                        {
                            id: 'streaming',
                            role: 'assistant',
                            content: data.chunk,
                            timestamp: new Date()
                        }
                    ];
                }
            });
            scrollToBottom();
        });

        socket.on("chat:end", (data: { fullResponse: string }) => {
            setLoading(false);
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                // Finalize the message ID
                return [
                    ...prev.slice(0, -1),
                    { ...lastMsg, id: Date.now().toString(), content: data.fullResponse }
                ];
            });
        });

        socket.on("chat:error", () => {
            setLoading(false);
            alert("Connection error. Please try again.");
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        scrollToBottom();

        // Emit message to server via WebSocket
        socket.emit("chat:message", {
            message: input,
            history: messages.map(m => ({ role: m.role, content: m.content })) // Send context
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-screen bg-muted/30">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-muted/20 hidden md:flex flex-col">
                <div className="p-6 border-b border-muted/20">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
                        <Sparkles className="w-6 h-6" />
                        Orion Coach
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Recent Chats</div>
                    {['Interview Prep: Google', 'Salary Negotiation', 'Resume Review'].map((chat, i) => (
                        <button key={i} className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 text-sm flex items-center gap-2 transition-colors">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{chat}</span>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-muted/20">
                    <button className="w-full flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        <History className="w-4 h-4" />
                        View History
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                <header className="bg-white border-b border-muted/20 p-4 flex items-center justify-between md:hidden">
                    <Link href="/dashboard" className="font-bold text-primary flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Orion
                    </Link>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-white'
                                }`}>
                                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                            </div>

                            <div className={`rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-white border border-muted/20 rounded-tl-none'
                                }`}>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {loading && messages[messages.length - 1]?.role === 'user' && (
                        <div className="flex gap-4 max-w-3xl mx-auto">
                            <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="bg-white border border-muted/20 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Orion is thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-muted/20">
                    <div className="max-w-3xl mx-auto relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask Orion anything about your career..."
                            className="w-full bg-muted/30 border border-muted/20 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                        Orion uses AI and may make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    );
}
