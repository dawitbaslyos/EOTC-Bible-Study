
import React, { useState } from 'react';
import { Icons } from '../constants';

interface Props {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to Senay",
    body: "Enter a digital sanctuary dedicated to the 81-book Ethiopian Orthodox canon. Our path is one of deep contemplation.",
    icon: <Icons.Lotus className="w-12 h-12" />
  },
  {
    title: "Understand the Word",
    body: "Move beyond simple reading. Engage with traditional Andimta commentary and spiritual reflections that explain the mysteries of the faith.",
    icon: <Icons.Book className="w-10 h-10" />
  },
  {
    title: "Sacred Rhythms",
    body: "Sync your life with the liturgical seasons and fasting periods of our ancestors. Grow closer to the Divine through daily practice.",
    icon: <Icons.Feather className="w-10 h-10" />
  }
];

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-primary)] animate-in fade-in duration-1000 min-h-screen">
      <div className="max-w-md w-full space-y-12">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-[var(--card-bg)] border border-[var(--gold)]/20 rounded-full flex items-center justify-center text-[var(--gold)] shadow-2xl scale-125 transition-transform">
            {steps[currentStep].icon}
          </div>
        </div>

        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-500">
          <h1 className="text-4xl serif gold-glow text-[var(--gold)] font-bold">{steps[currentStep].title}</h1>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed">{steps[currentStep].body}</p>
        </div>

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
            <span className="serif text-lg">{currentStep === steps.length - 1 ? "Enter Sanctuary" : "Next"}</span>
            <Icons.ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
