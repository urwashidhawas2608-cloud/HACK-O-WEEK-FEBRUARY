import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, MessageSquare, Smartphone, Globe, MessageCircle, Settings, BarChart3, AlertCircle, ExternalLink, ChevronRight, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { getChatResponse, ChatMessage, ChatResponse, ExtractedEntities } from './services/geminiService';

type Platform = 'web' | 'mobile' | 'whatsapp';

interface LogEntry {
  id: string;
  query: string;
  response: string;
  entities: ExtractedEntities;
  timestamp: number;
  label?: string;
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [platform, setPlatform] = useState<Platform>('web');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'admin' | 'strategy'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: ChatResponse = await getChatResponse(input, messages.slice(-4));
      
      const botMessage: ChatMessage = {
        role: 'model',
        text: response.answer,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Log interaction
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        query: input,
        response: response.answer,
        entities: response.entities,
        timestamp: Date.now(),
        label: response.isOutOfScope ? 'Out of Scope' : 'Valid'
      };
      setLogs(prev => [newLog, ...prev]);

    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (msg: ChatMessage, index: number) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
        <div className={`p-2 rounded-full ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
          {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-slate-600" />}
        </div>
        <div className={`p-3 rounded-2xl ${
          msg.role === 'user' 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
        }`}>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Markdown>{msg.text}</Markdown>
          </div>
          <div className={`text-[10px] mt-1 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const PlatformPreview = () => {
    const containerClass = {
      web: "w-full h-full bg-slate-50 rounded-xl border border-slate-200 flex flex-col",
      mobile: "w-[320px] h-[580px] bg-black rounded-[3rem] border-[8px] border-slate-800 relative overflow-hidden mx-auto shadow-2xl",
      whatsapp: "w-[320px] h-[580px] bg-[#e5ddd5] rounded-[3rem] border-[8px] border-slate-800 relative overflow-hidden mx-auto shadow-2xl"
    };

    return (
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className={containerClass[platform]}>
          {platform !== 'web' && (
            <div className="h-6 bg-slate-800 w-full flex justify-center items-center">
              <div className="w-16 h-1 bg-slate-700 rounded-full"></div>
            </div>
          )}
          
          {/* Header */}
          <div className={`${platform === 'whatsapp' ? 'bg-[#075e54] text-white' : 'bg-white border-b border-slate-200'} p-4 flex items-center gap-3`}>
            {platform === 'whatsapp' ? (
              <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center overflow-hidden">
                <Bot className="text-white" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Bot className="text-indigo-600" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm">UniBot Assistant</h3>
              <p className="text-[10px] opacity-70">Always active</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto p-4 ${platform === 'whatsapp' ? 'bg-[url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")] bg-repeat' : ''}`}>
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40">
                <MessageSquare size={48} className="mb-4" />
                <p className="text-sm">Ask me anything about your courses, exams, or university life!</p>
              </div>
            )}
            {messages.map((msg, i) => renderMessage(msg, i))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your question..."
                className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-indigo-600" />
            Insights & Logs
          </h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {logs.length} Total Queries
            </span>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              {logs.filter(l => l.label === 'Out of Scope').length} Out of Scope
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">New Intents Identified</h4>
            <ul className="space-y-2">
              <li className="text-sm flex items-center gap-2"><ChevronRight size={14} className="text-indigo-500" /> Scholarship Inquiries</li>
              <li className="text-sm flex items-center gap-2"><ChevronRight size={14} className="text-indigo-500" /> Library Room Booking</li>
              <li className="text-sm flex items-center gap-2"><ChevronRight size={14} className="text-indigo-500" /> Cafeteria Menus</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Proposed FAQs</h4>
            <ul className="space-y-2">
              <li className="text-sm flex items-center gap-2"><ChevronRight size={14} className="text-indigo-500" /> "How to reset EduPortal password?"</li>
              <li className="text-sm flex items-center gap-2"><ChevronRight size={14} className="text-indigo-500" /> "Where is the Registrar office?"</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Pattern Improvements</h4>
            <p className="text-sm text-slate-600 italic">"Students frequently ask about 'sem' instead of 'semester'. Entity recognition updated to handle both."</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Query</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Entities</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Label</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-medium text-slate-800">{log.query}</p>
                    <p className="text-xs text-slate-500 truncate max-w-xs">{log.response}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {log.entities.courseCodes?.map(c => <span key={c} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{c}</span>)}
                      {log.entities.semesterNumbers?.map(s => <span key={s} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">{s}</span>)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      log.label === 'Out of Scope' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {log.label}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 italic">No logs available yet. Start chatting!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const StrategyGuide = () => (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="text-indigo-600" />
            Out-of-Scope Strategy
          </h2>
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <p className="text-slate-700 mb-4">
              When a student asks a question that falls outside the defined knowledge base (Exams, Courses, Admin), the bot follows a 3-step escalation path:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 text-indigo-600 font-bold">1</div>
                <h4 className="font-bold text-sm mb-1">Clarification</h4>
                <p className="text-xs text-slate-500">"I'm not sure I understand. Are you asking about a specific course or exam?"</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 text-indigo-600 font-bold">2</div>
                <h4 className="font-bold text-sm mb-1">Suggestion</h4>
                <p className="text-xs text-slate-500">"I can help with exam dates or course codes. Would you like to see the exam schedule?"</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 text-indigo-600 font-bold">3</div>
                <h4 className="font-bold text-sm mb-1">Human Routing</h4>
                <p className="text-xs text-slate-500">"For this specific query, please contact our student advisors at <span className="text-indigo-600 underline cursor-pointer">helpdesk@uni.edu</span>"</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Smartphone className="text-indigo-600" />
            Multi-Platform Logic
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-slate-100 rounded-xl"><Globe size={24} className="text-slate-600" /></div>
              <div>
                <h4 className="font-bold">Web Widget</h4>
                <p className="text-sm text-slate-600">Full markdown support, rich media, persistent history, and direct links to university portals.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-slate-100 rounded-xl"><Smartphone size={24} className="text-slate-600" /></div>
              <div>
                <h4 className="font-bold">Mobile App</h4>
                <p className="text-sm text-slate-600">Push notifications for exam alerts, biometric login, and offline access to cached schedules.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-slate-100 rounded-xl"><MessageCircle size={24} className="text-slate-600" /></div>
              <div>
                <h4 className="font-bold">WhatsApp Business</h4>
                <p className="text-sm text-slate-600">Text-focused, quick replies, automated menu options, and easy document sharing (PDF results).</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-8">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Bot size={28} />
        </div>
        
        <nav className="flex flex-col gap-4">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <MessageSquare size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <BarChart3 size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('strategy')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'strategy' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings size={24} />
          </button>
        </nav>

        <div className="mt-auto">
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Student Support AI</h1>
            <p className="text-xs text-slate-500">Prototype v1.0 • Multi-turn Enabled</p>
          </div>
          
          {activeTab === 'chat' && (
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setPlatform('web')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${platform === 'web' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                Web
              </button>
              <button 
                onClick={() => setPlatform('mobile')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${platform === 'mobile' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                Mobile
              </button>
              <button 
                onClick={() => setPlatform('whatsapp')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${platform === 'whatsapp' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                WhatsApp
              </button>
            </div>
          )}
        </header>

        {/* Content Switcher */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 flex overflow-hidden"
          >
            {activeTab === 'chat' && <PlatformPreview />}
            {activeTab === 'admin' && <AdminDashboard />}
            {activeTab === 'strategy' && <StrategyGuide />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
