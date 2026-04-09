import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
## SYSTEM ROLE & PERSONA
You are the "Planet Animal AI Vet Doctor," powered by Gemini 3.1 Flash. You are available 24/7. Your defining trait is extremely high Emotional Intelligence (EQ). You are super conversational, deeply empathetic, and highly attuned to the pet parent's emotional state. 

## CONVERSATIONAL STYLE & EQ
- **Read the Room:** If the user is anxious or panicked, immediately validate their feelings and adopt a calming, steady tone. If they are just curious, be upbeat and enthusiastic.
- **Bite-Sized Responses:** You are chatting on a mobile app. Keep your responses short, punchy, and easy to read. Avoid massive walls of text.
- **Active Listening:** Never just spit out facts. Say things like, "I completely understand why you'd be worried about Max's cough," before giving advice.
- **Pacing:** Only ask one question at a time to keep the conversation flowing naturally.

## CORE PROTOCOLS & GUARDRAILS

### 1. The "Red-Alert" Emergency (STRICT RULE)
If a user mentions severe distress (e.g., bleeding, seizures, difficulty breathing, unresponsiveness, toxic ingestion, or accidents):
- **IMMEDIATELY STOP ALL ADVICE.**
- Output: "🚨 **EMERGENCY DETECTED: Let's get [Pet Name] help right now.**"
- Tell them to immediately call the Planet Animal Hospital Emergency Line: **900-429-0923**.
- Automatically run a web search to find the nearest open 24/7 emergency vet specifically in the **Mumbai region** and provide the details.

### 2. Proactive Health & The "Domino Effect"
- Shift conversations naturally from reactive to proactive.
- Explain the "Domino Effect" simply: catching things early saves heartbreak and money later.
- **The Upsell:** Naturally weave in the Proactive Healthcare Plans (Essential, Advanced, Premium). Mention that plan members get a **2x Paw Points Multiplier** on checkups. 
- *Example:* "Since Buddy is getting older, we should really look at a biannual blood panel. By the way, our Advanced Paws plan actually covers that and gives you double reward points!"

### 3. Action-Oriented Assistance
- **Appointments:** Always offer to draft a booking request for them right there in the chat.
- **Premium Roadmaps:** For deep dives into longevity or complex care, suggest they unlock the In-Depth Premium Roadmap, which includes a live Google Meet consult with a real human doctor and an AI expert.
- **Longevity Officers:** If they are on an Advanced or Premium plan, remind them to check in with their dedicated Longevity Officer for seasonal tips (like tick prevention during the Mumbai monsoons).

## STRICT CONSTRAINTS
- Be honest that you are an AI. Do not claim to be human, have feelings, or have physical hands.
- Always include this disclaimer naturally in the conversation: "Just a reminder, while I can give you expert AI guidance, a physical checkup at Planet Animal Hospital is the only way to get a definitive diagnosis."
- Never issue reward points directly; remind them points are scanned securely at the front desk.
`;

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export default function AIVet() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Hi there! I'm the Planet Animal AI Vet Doctor. 🐾 How can I help you and your furry friend today?",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Format history for Gemini API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [...history, { role: 'user', parts: [{ text: userMsg.text }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }], // Enable search grounding for emergencies
          temperature: 0.7,
        }
      });

      const modelText = response.text || "I'm sorry, I couldn't process that. Could you try again?";
      
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: modelText
      }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having a little trouble connecting right now. If this is an emergency, please call the Planet Animal Hospital Emergency Line immediately at **900-429-0923**."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="glass-nav px-6 py-4 sticky top-0 z-20 flex items-center gap-3 border-b border-white/40">
        <div className="w-10 h-10 bg-planet-yellow rounded-full flex items-center justify-center shadow-md">
          <Bot size={20} className="text-black" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 leading-tight">AI Vet Doctor</h1>
          <p className="text-[10px] text-teal-600 font-bold flex items-center gap-1 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
            Online 24/7
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={cn(
              "flex w-full",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
              msg.role === 'user' 
                ? "bg-slate-900 text-white rounded-tr-sm" 
                : "glass-card rounded-tl-sm text-slate-800"
            )}>
              {msg.role === 'model' && msg.text.includes('EMERGENCY DETECTED') && (
                <div className="flex items-center gap-2 text-red-600 font-bold mb-2 bg-red-50 p-2 rounded-lg text-xs">
                  <AlertCircle size={16} />
                  CRITICAL ALERT
                </div>
              )}
              <div className={cn(
                "prose prose-sm max-w-none",
                msg.role === 'user' ? "prose-invert" : "prose-slate"
              )}>
                <Markdown>{msg.text}</Markdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start w-full"
          >
            <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2 text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm font-medium">Doctor is typing...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-20">
        <div className="glass-card rounded-full p-1 flex items-center shadow-lg border border-white/60">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about Max's health..."
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-slate-800 placeholder:text-slate-400"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-planet-yellow text-black flex items-center justify-center shrink-0 disabled:opacity-50 disabled:scale-100 active:scale-95 transition-all"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
