
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { ChatMessage, Book, Quote } from '../types';
import { getSpiritualReflection } from '../services/geminiService';

interface Props {
  onClose: () => void;
  currentQuote?: Quote;
}

const AskMemhir: React.FC<Props> = ({ onClose, currentQuote }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachTray, setShowAttachTray] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<ChatMessage['attachment'] | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [voiceBars, setVoiceBars] = useState<number[]>(new Array(12).fill(10));
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('./80-weahadu.json')
      .then(res => res.json())
      .then(setBooks);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setVoiceBars(prev => prev.map(() => Math.floor(Math.random() * 50) + 10));
      }, 100);
    } else {
      setVoiceBars(new Array(12).fill(2));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim() && !selectedAttachment) return;

    const userMsg: ChatMessage = { 
      role: 'user', 
      content: text || (selectedAttachment ? `I wish to reflect on this ${selectedAttachment.type}: ${selectedAttachment.title}.` : ""),
      attachment: selectedAttachment || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSelectedAttachment(null);
    setIsTyping(true);

    const context = selectedAttachment 
      ? `Discussion centered on: ${selectedAttachment.title} (${selectedAttachment.type}).` 
      : 'General spiritual counsel.';
    
    const response = await getSpiritualReflection([...messages, userMsg], context);

    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
  };

  const startVoiceSim = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setInputValue("How do I stay faithful in a busy world?");
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0c] animate-in fade-in duration-1000 h-screen overflow-hidden">
      <header className="p-6 border-b border-white/10 flex justify-between items-center backdrop-blur-xl bg-black/40 sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shadow-lg">
            <Icons.Lotus />
          </div>
          <div>
            <h2 className="serif text-xl text-[#d4af37] gold-glow">Ask Memhir</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Sacred Counselor</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <Icons.Close />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar pb-40 pt-10">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-10 opacity-60">
            <div className="p-10 border border-white/5 rounded-[4rem] bg-white/[0.02] max-w-sm shadow-inner">
              <Icons.Feather />
              <p className="serif italic text-xl mt-4 leading-relaxed text-gray-200">"Wisdom begins in silence. Ask of the mysteries and let the fathers speak."</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-lg">
              {["Explain Andimta", "Who is St. Yared?", "Finding Peace", "Prayer Life"].map((prompt, i) => (
                <button 
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-6 py-3 bg-white/5 rounded-full text-[10px] uppercase tracking-[0.15em] border border-white/5 hover:border-[#d4af37]/40 hover:text-[#d4af37] transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-5 duration-500`}>
            <div className={`max-w-[85%] rounded-[2.5rem] p-7 shadow-2xl relative ${
              msg.role === 'user' 
                ? 'bg-[#d4af37] text-black font-semibold shadow-[#d4af37]/10' 
                : 'bg-white/5 border border-white/10 text-gray-100 ethiopic text-xl leading-relaxed'
            }`}>
              {msg.attachment && (
                <div className={`mb-4 p-3 rounded-2xl flex items-center space-x-3 border ${msg.role === 'user' ? 'bg-black/10 border-black/10' : 'bg-black/40 border-white/10'}`}>
                  <Icons.Book />
                  <div className="text-xs font-bold truncate opacity-80">{msg.attachment.title}</div>
                </div>
              )}
              <p>{msg.content}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-full flex items-center space-x-3 animate-pulse">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Memhir is reflecting</span>
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pb-12 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/90 to-transparent fixed bottom-0 left-0 w-full z-30">
        <div className="max-w-3xl mx-auto">
          {selectedAttachment && (
            <div className="mb-4 flex items-center justify-between p-4 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-3xl animate-in slide-in-from-bottom-4">
              <div className="flex items-center space-x-3">
                 <Icons.Book />
                 <span className="text-xs font-bold text-[#d4af37]">{selectedAttachment.title}</span>
              </div>
              <button onClick={() => setSelectedAttachment(null)} className="text-[#d4af37] hover:scale-110 transition-transform"><Icons.Close /></button>
            </div>
          )}

          <div className="flex items-center space-x-4 bg-white/5 border border-white/10 rounded-[3rem] p-3 backdrop-blur-2xl shadow-2xl">
            <button 
              onClick={() => setShowAttachTray(!showAttachTray)}
              className={`p-4 rounded-full transition-all ${showAttachTray ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Icons.Attach />
            </button>
            
            <div className="flex-1 relative">
              {isRecording ? (
                <div className="h-12 flex items-center justify-center space-x-2 px-4">
                  {voiceBars.map((h, i) => (
                    <div key={i} className="w-1.5 bg-[#d4af37] rounded-full transition-all duration-100" style={{ height: `${h}%` }} />
                  ))}
                </div>
              ) : (
                <input 
                  type="text"
                  placeholder="Inquire of the Fathers..."
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-600 px-4 py-3 text-lg"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
              )}
            </div>

            <button 
              onClick={isRecording ? () => setIsRecording(false) : startVoiceSim}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-white/5 text-[#d4af37] hover:bg-white/10'}`}
            >
              <Icons.Mic />
            </button>
            
            {!isRecording && (
              <button 
                onClick={() => handleSendMessage()}
                className="w-14 h-14 rounded-full bg-[#d4af37] text-black flex items-center justify-center shadow-xl shadow-[#d4af37]/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Icons.ChevronRight />
              </button>
            )}
          </div>

          {showAttachTray && (
            <div className="mt-4 grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-6 duration-300">
              <button 
                onClick={() => {
                  if (currentQuote) setSelectedAttachment({ type: 'quote', title: currentQuote.source });
                  setShowAttachTray(false);
                }}
                className="flex flex-col items-start p-6 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 hover:border-[#d4af37]/30 group transition-all"
              >
                <Icons.Cloud />
                <div className="mt-3">
                  <div className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Daily Wisdom</div>
                  <div className="text-xs text-gray-500 truncate mt-1">{currentQuote?.source || "Scripture"}</div>
                </div>
              </button>
              
              <div className="relative group overflow-hidden bg-white/5 border border-white/5 rounded-[2.5rem] hover:border-[#d4af37]/30 transition-all">
                <select 
                  className="w-full h-full opacity-0 absolute inset-0 cursor-pointer z-10"
                  onChange={(e) => {
                    const book = books.find(b => b.id === e.target.value);
                    if (book) setSelectedAttachment({ type: 'book', title: book.name });
                    setShowAttachTray(false);
                  }}
                >
                  <option value="">Attach Scroll...</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <div className="flex flex-col items-start p-6 group-hover:bg-white/10 transition-all h-full">
                  <Icons.Book />
                  <div className="mt-3">
                    <div className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Scripture</div>
                    <div className="text-xs text-gray-500 truncate mt-1">Select Scroll...</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AskMemhir;
