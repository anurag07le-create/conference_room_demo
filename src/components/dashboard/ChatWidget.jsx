import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ChatWidget = () => {
    const { user, profile } = useAuth();

    // Wait for user to load before checking role
    if (!user) return null;

    // UC-7: Chatbot is only for Employees
    const isEmployee = user?.role?.toUpperCase() === 'EMPLOYEE';

    if (!isEmployee) return null;

    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { id: 'welcome', text: `Hi ${profile?.full_name || 'there'}! I'm Pucho AI. Ask me about room availability!`, sender: 'bot', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Replace with your actual UC-7 Webhook URL from Pucho Studio
    const CHATBOT_WEBHOOK_URL = import.meta.env.VITE_SMART_COMM_WEBHOOK_URL || "https://studio.pucho.ai/api/v1/webhooks/8F0t3Zmk3XRABYJ8P77k6";

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMsg = {
            id: Date.now(),
            text: message,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        const currentMsg = message;
        setMessage('');
        setIsTyping(true);

        try {
            // Temporarily disabled - Pucho workflow needs fixing
            // TODO: Re-enable when Pucho fixes their AI model

            // Simulate bot response for now
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: "Chat feature is temporarily disabled. Please contact admin for room availability.",
                    sender: 'bot',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
                setIsTyping(false);
            }, 1000);

            /*
            const response = await fetch(CHATBOT_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action_type: "chat_query",
                    message: currentMsg,
                    user_email: user?.email,
                    user_name: profile?.full_name
                })
            });

            const data = await response.json();
            const botReply = data.reply || data.message || "I'm processing your request. Please check Pucho Studio for the response configuration.";

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: botReply,
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
            */
        } catch (error) {
            console.error("Chatbot Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "Chat feature is temporarily disabled. Please contact admin for room availability.",
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-[#4F27E9] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
                >
                    <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="w-[360px] h-[500px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-[#4F27E9] p-4 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                                <Bot size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Pucho AI Assistant</h3>
                                <p className="text-[10px] text-white/70 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    Online • Always ready to help
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] ${msg.sender === 'user' ? 'bg-[#4F27E9] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-[13px] shadow-sm ${msg.sender === 'user'
                                            ? 'bg-[#4F27E9] text-white rounded-tr-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                        <p className={`text-[9px] mt-1 ${msg.sender === 'user' ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                                            {msg.time}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <Loader2 size={12} className="animate-spin text-[#4F27E9]" />
                                    <span className="text-[11px] text-gray-400 font-medium tracking-tight">AI is thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask about availability..."
                            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#4F27E9]/20 transition-all outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim() || isTyping}
                            className="w-10 h-10 bg-[#4F27E9] text-white rounded-xl flex items-center justify-center hover:bg-[#3D1DB3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
