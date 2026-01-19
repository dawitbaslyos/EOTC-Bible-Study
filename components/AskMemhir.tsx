
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { ChatMessage, Book, Quote, Theme } from '../types';
import { getSpiritualReflectionStream } from '../services/geminiService';

interface Props {
  onClose: () => void;
  currentQuote?: Quote;
  theme: Theme;
}

const AskMemhir: React.FC<Props> = ({ onClose, currentQuote, theme }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachTray, setShowAttachTray] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<ChatMessage['attachment'] | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [voiceBars, setVoiceBars] = useState<number[]>(new Array(12).fill(10));
  const [streamingText, setStreamingText] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch('./data/80-weahadu.json')
      .then(res => res.json())
      .then(setBooks);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping, streamingText]);

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

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64String = result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64Data = await blobToBase64(audioBlob);
        handleSendMessage("", { data: base64Data, mimeType: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async (text: string = inputValue, audioData?: { data: string, mimeType: string }) => {
    if (!text.trim() && !selectedAttachment && !audioData) return;

    const attachment = audioData ? {
      type: 'audio' as const,
      title: 'Voice Note',
      data: audioData.data,
      mimeType: audioData.mimeType
    } : (selectedAttachment || undefined);

    const userMsg: ChatMessage = { 
      role: 'user', 
      content: text || (audioData ? "Sent a voice note." : (selectedAttachment ? `Exploring: ${selectedAttachment.title}.` : "")),
      attachment
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSelectedAttachment(null);
    setIsTyping(true);
    setStreamingText('');

    try {
      const context = selectedAttachment 
        ? `Focusing on: ${selectedAttachment.title}.` 
        : 'General inquiry.';
      
      const stream = await getSpiritualReflectionStream([...messages, userMsg], context);

      let fullResponse = '';
      for await (const chunk of stream) {
        const textChunk = chunk.text;
        if (textChunk) {
          fullResponse += textChunk;
          setStreamingText(fullResponse);
        }
      }

      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
      setStreamingText('');
    } catch (error) {
      console.error("Error:", error);
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please try again." }]);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] animate-in fade-in duration-700 h-screen overflow-hidden">
      <header className="px-4 py-4 md:px-8 md:py-6 border-b border-theme flex justify-between items-center backdrop-blur-xl bg-[var(--bg-primary)]/80 sticky top-0 z-20">
        <div className="flex items-center space-x-3 md:space-x-5">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[var(--gold-muted)] border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] shadow-sm">
            <Icons.Message />
          </div>
          <div>
            <h2 className="serif text-xl md:text-2xl text-[var(--gold)] gold-glow tracking-wide">Ask for Guidance</h2>
            <p className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">Personal Guide</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-3 bg-[var(--card-bg)] rounded-full hover:bg-[var(--gold-muted)] transition-all active:scale-90 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <Icons.Close />
        </button>
      </header>

      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 md:space-y-12 custom-scrollbar pb-64 pt-6"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-12 opacity-80 px-4">
            <div className="p-10 md:p-14 border border-theme rounded-[3rem] bg-[var(--card-bg)] max-w-md shadow-lg relative overflow-hidden group">
              <div className="flex justify-center mb-8 text-[var(--gold)] animate-pulse">
                <Icons.Feather />
              </div>
              <p className="serif italic text-xl md:text-2xl leading-[1.6] text-[var(--text-primary)]">
                "Type or speak your question. I'm here to help you understand."
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}
          >
            <div className={`${
              msg.role === 'user' 
                ? 'max-w-[85%] md:max-w-[75%] bg-[var(--gold)] text-black font-bold rounded-t-[2rem] rounded-bl-[2rem] p-6 md:p-8 shadow-xl' 
                : 'max-w-[90%] md:max-w-[80%] flex flex-col items-start'
            }`}>
              {msg.attachment && msg.role === 'user' && (
                <div className="mb-4 p-3 rounded-xl flex items-center space-x-3 bg-black/10 border border-black/10">
                  <div className="text-black/60">
                    {msg.attachment.type === 'audio' ? <Icons.Mic /> : <Icons.Book />}
                  </div>
                  <div className="text-xs font-black truncate">{msg.attachment.title}</div>
                </div>
              )}
              <div className={`${
                msg.role === 'assistant' 
                  ? 'bg-[var(--bg-secondary)] border border-theme rounded-t-[3rem] rounded-br-[3rem] p-8 md:p-10 text-[var(--text-primary)] ethiopic text-xl md:text-2xl leading-relaxed tracking-wide shadow-lg relative overflow-hidden w-full'
                  : 'whitespace-pre-wrap break-words text-lg md:text-xl'
              }`}>
                {msg.role === 'assistant' ? (
                   <>
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent" />
                     {msg.content}
                   </>
                ) : msg.content}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-[var(--bg-secondary)] opacity-50 border border-theme rounded-t-[3rem] rounded-br-[3rem] p-8 md:p-10 text-[var(--text-muted)] ethiopic text-xl md:text-2xl leading-relaxed tracking-wide shadow-lg w-full animate-pulse">
                {streamingText || "Reflecting..."}
             </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-10 pb-10 md:pb-14 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/98 to-transparent fixed bottom-0 left-0 w-full z-30">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="flex items-center space-x-3 md:space-x-4 bg-[var(--card-bg)] border border-theme rounded-[2.5rem] md:rounded-[3rem] p-2 md:p-3 backdrop-blur-3xl shadow-xl w-full">
            <button 
              onClick={() => setShowAttachTray(!showAttachTray)}
              className={`p-4 md:p-5 rounded-full transition-all ${showAttachTray ? 'bg-[var(--gold)] text-black shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <Icons.Attach />
            </button>
            
            <div className="flex-1 relative min-w-0">
              {isRecording ? (
                <div className="h-14 flex items-center space-x-2 px-4 w-full">
                  {voiceBars.map((h, i) => (
                    <div key={i} className="w-1.5 md:w-2 bg-[var(--gold)] rounded-full transition-all duration-100" style={{ height: `${h}%` }} />
                  ))}
                  <span className="text-[10px] text-[var(--gold)] font-black uppercase tracking-widest ml-4">Listening...</span>
                </div>
              ) : (
                <textarea 
                  ref={textareaRef}
                  placeholder="Ask a question..."
                  className="w-full min-h-[56px] max-h-32 bg-transparent border-none focus:ring-0 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-2 md:px-4 py-3.5 text-lg md:text-xl ethiopic resize-none overflow-y-auto"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                />
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[var(--bg-secondary)] text-[var(--gold)] hover:bg-[var(--card-bg)]'}`}
              >
                <Icons.Mic />
              </button>
              
              {!isRecording && (
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() && !selectedAttachment}
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
                    inputValue.trim() || selectedAttachment 
                    ? 'bg-[var(--gold)] text-black shadow-lg' 
                    : 'bg-[var(--card-bg)] text-[var(--text-muted)]'
                  }`}
                >
                  <Icons.ChevronRight />
                </button>
              )}
            </div>
          </div>

          {showAttachTray && (
            <div className="mt-4 grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-6 duration-500 w-full">
              <button 
                onClick={() => {
                  if (currentQuote) setSelectedAttachment({ type: 'quote', title: "Daily Quote" });
                  setShowAttachTray(false);
                }}
                className="flex items-center space-x-4 p-4 bg-[var(--card-bg)] border border-theme rounded-2xl hover:border-[var(--gold)]/30 transition-all"
              >
                <div className="text-[var(--gold)]"><Icons.Cloud /></div>
                <div className="text-left">
                  <div className="text-[9px] font-black text-[var(--gold)] uppercase tracking-widest">Quote</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">Refer to daily word</div>
                </div>
              </button>
              
              <div className="relative group bg-[var(--card-bg)] border border-theme rounded-2xl hover:border-[var(--gold)]/30 overflow-hidden">
                <select 
                  className="w-full h-full opacity-0 absolute inset-0 cursor-pointer z-10"
                  onChange={(e) => {
                    const book = books.find(b => b.id === e.target.value);
                    if (book) setSelectedAttachment({ type: 'book', title: book.name });
                    setShowAttachTray(false);
                  }}
                >
                  <option value="">Book</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <div className="flex items-center space-x-4 p-4 h-full">
                  <div className="text-[var(--gold)]"><Icons.Book /></div>
                  <div className="text-left">
                    <div className="text-[9px] font-black text-[var(--gold)] uppercase tracking-widest">Book</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Refer to library</div>
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
