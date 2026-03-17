
import React, { useState } from 'react';
import { Icons } from '../constants';
import { RitualTime } from '../types';

interface Props {
  onComplete: (rituals: RitualTime[]) => void;
}

const steps = [
  {
    title: "Welcome",
    body: "Explore the 81 books of the Ethiopian Orthodox Bible with daily guidance.",
    icon: <Icons.Logo className="w-16 h-16 object-contain" />
  },
  {
    title: "Understand the Bible",
    body: "Read traditional explanations for verses and get answers to your questions.",
    icon: <Icons.Book className="w-10 h-10" />
  },
  {
    title: "Your Routine",
    body: "Choose when you would like to do your daily reading.",
    icon: <Icons.Feather className="w-10 h-10" />,
    isInteractive: true
  }
];

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRituals, setSelectedRituals] = useState<RitualTime[]>(['day']);

  const toggleRitual = (r: RitualTime) => {
    setSelectedRituals(prev => {
      if (prev.includes(r)) {
        if (prev.length > 1) return prev.filter(i => i !== r);
        return prev;
      }
      return [...prev, r];
    });
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(selectedRituals);
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-primary)] animate-in fade-in duration-1000 min-h-screen">
      <div className="max-w-md w-full space-y-10 md:space-y-12">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-[var(--card-bg)] border border-[var(--gold)]/20 rounded-full flex items-center justify-center shadow-2xl scale-125 transition-transform overflow-hidden">
            {steps[currentStep].icon}
          </div>
        </div>

        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-500">
          <h1 className="text-3xl md:text-4xl serif gold-glow text-[var(--gold)] font-bold">{steps[currentStep].title}</h1>
          <p className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed">{steps[currentStep].body}</p>
        </div>

        {isLastStep && (
          <div className="grid grid-cols-1 gap-4 animate-in fade-in zoom-in duration-700 delay-300">
            {[
              { id: 'day' as RitualTime, label: 'Morning', desc: 'Start your day with a reading', icon: <Icons.Sun className="w-5 h-5" /> },
              { id: 'night' as RitualTime, label: 'Evening', desc: 'Read before you sleep', icon: <Icons.Moon className="w-5 h-5" /> }
            ].map(r => {
              const active = selectedRituals.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleRitual(r.id)}
                  className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all text-left ${
                    active 
                      ? 'bg-[var(--gold-muted)] border-[var(--gold)] shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                      : 'bg-[var(--card-bg)] border-theme opacity-60 hover:opacity-100 hover:border-[var(--gold)]/30'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={active ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'}>{r.icon}</div>
                    <div>
                      <div className={`text-sm font-bold ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{r.label}</div>
                      <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">{r.desc}</div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-[var(--gold)] bg-[var(--gold)]' : 'border-theme'}`}>
                    {active && <Icons.ChevronRight className="w-3 h-3 text-black" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col items-center space-y-6">
          <div className="flex space-x-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-[var(--gold)]' : 'w-2 bg-[var(--text-muted)]/20'}`} />
            ))}
          </div>

          <button 
            onClick={next} 
            className="w-full bg-[var(--gold)] text-black font-bold py-5 rounded-full hover:brightness-110 transition-all flex items-center justify-center space-x-3 shadow-xl active:scale-95"
          >
            <span className="serif text-lg">{isLastStep ? "Get Started" : "Next"}</span>
            <Icons.ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
