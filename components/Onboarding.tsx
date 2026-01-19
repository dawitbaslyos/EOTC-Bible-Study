
import React, { useState } from 'react';
import { Icons } from '../constants';
import { RitualTime } from '../types';

interface Props {
  onComplete: (preferences: RitualTime[]) => void;
}

const steps = [
  {
    title: "Welcome to Senay",
    body: "Your journey into the 81-book Ethiopian Orthodox canon begins here. Understand the Word, not just read it.",
    icon: <Icons.Lotus />
  },
  {
    title: "Daily Manna",
    body: "Engage with traditional Andimta commentary and spiritual reflections that deepen your connection every day.",
    icon: <Icons.Book />
  },
  {
    title: "Sanctuary Rhythms",
    body: "Follow the liturgical seasons and fasting periods of our ancestors in a modern digital sanctuary.",
    icon: <Icons.Feather />
  }
];

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<RitualTime[]>([]);

  const togglePreference = (pref: RitualTime) => {
    if (preferences.includes(pref)) {
      setPreferences(preferences.filter(p => p !== pref));
    } else {
      setPreferences([...preferences, pref]);
    }
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(steps.length);
    }
  };

  if (currentStep === steps.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a0a0c] animate-in fade-in duration-1000">
        <div className="max-w-md w-full space-y-12">
          <div className="space-y-4">
             <h1 className="text-4xl serif gold-glow text-[#d4af37]">Set Your Rhythm</h1>
             <p className="text-gray-400 text-lg">When do you seek the quietest waters for reflection? (Select one or both)</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => togglePreference('day')}
              className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center space-y-3 ${preferences.includes('day') ? 'bg-[#d4af37]/10 border-[#d4af37] shadow-xl' : 'bg-white/5 border-white/10 hover:border-[#d4af37]/30'}`}
            >
              <Icons.Sun className="w-10 h-10 text-[#d4af37]" />
              <div className="text-xl serif text-white">Morning Ritual</div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Setting your daily intention</p>
            </button>

            <button 
              onClick={() => togglePreference('night')}
              className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center space-y-3 ${preferences.includes('night') ? 'bg-[#d4af37]/10 border-[#d4af37] shadow-xl' : 'bg-white/5 border-white/10 hover:border-[#d4af37]/30'}`}
            >
              <Icons.Moon className="w-10 h-10 text-[#d4af37]" />
              <div className="text-xl serif text-white">Evening Ritual</div>
              <p className="text-[10px] uppercase tracking-widest text-gray-600">Releasing the day to the Divine</p>
            </button>
          </div>

          <button 
            disabled={preferences.length === 0}
            onClick={() => onComplete(preferences)}
            className="w-full bg-[#d4af37] text-black font-bold py-5 rounded-full shadow-xl active:scale-95 disabled:opacity-30 transition-all uppercase tracking-widest text-xs"
          >
            Begin My Journey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a0a0c] animate-in fade-in duration-1000">
      <div className="max-w-md w-full space-y-12">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-white/5 border border-[#d4af37]/20 rounded-full flex items-center justify-center text-[#d4af37] shadow-2xl scale-125">
            {steps[currentStep].icon}
          </div>
        </div>

        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-500">
          <h1 className="text-4xl serif gold-glow text-[#d4af37]">{steps[currentStep].title}</h1>
          <p className="text-gray-400 text-lg leading-relaxed">{steps[currentStep].body}</p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <div className="flex space-x-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-[#d4af37]' : 'w-2 bg-white/10'}`} />
            ))}
          </div>

          <button onClick={next} className="w-full bg-[#d4af37] text-black font-bold py-5 rounded-full hover:bg-[#c0a030] transition-all flex items-center justify-center space-x-3 shadow-xl active:scale-95">
            <span className="serif text-lg">Next</span>
            <Icons.ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
