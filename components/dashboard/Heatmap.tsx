
import React, { useState } from 'react';
import { WEEK_DAYS } from '../../constants';

interface HeatmapItem {
  count: number;
  isToday: boolean;
}

interface Props {
  data: HeatmapItem[];
}

const Heatmap: React.FC<Props> = ({ data }) => {
  const [tooltip, setTooltip] = useState<{index: number, count: number} | null>(null);

  return (
    <div className="pt-6 border-t border-white/10">
      <div className="space-y-4 relative">
        {/* Tooltip display */}
        {tooltip && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#d4af37] text-black text-[10px] font-bold py-1 px-3 rounded-full shadow-lg z-20 animate-in fade-in zoom-in duration-200">
            {tooltip.count} {tooltip.count === 1 ? 'Reading' : 'Readings'} Completed
          </div>
        )}

        <div className="grid grid-cols-7 gap-1.5 px-1">
          {WEEK_DAYS.map((d, i) => (
            <span 
              key={i} 
              className="text-[10px] text-center font-bold text-gray-700"
            >
              {d}
            </span>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1.5">
          {data.map((item, i) => {
            const val = item.count;
            return (
              <div 
                key={i} 
                onMouseEnter={() => setTooltip({ index: i, count: val })}
                onMouseLeave={() => setTooltip(null)}
                onTouchStart={() => setTooltip({ index: i, count: val })}
                className={`aspect-square rounded-[4px] transition-all relative cursor-help group ${
                  item.isToday ? 'ring-2 ring-[#d4af37] ring-offset-2 ring-offset-[#0a0a0c] z-10 scale-110' : ''
                } ${
                  val === 0 ? 'bg-white/5 border border-white/5' : 
                  val === 1 ? 'bg-[#d4af37]/30 border border-[#d4af37]/10' : 
                  val === 2 ? 'bg-[#d4af37]/60 border border-[#d4af37]/20' : 
                  'bg-[#d4af37] shadow-[0_0_10px_#d4af37]'
                } hover:scale-110 active:scale-95`}
              >
                {item.isToday && (
                  <div className="absolute inset-0 bg-[#d4af37] animate-pulse opacity-40 rounded-[4px]" />
                )}
                {/* Hidden label for accessibility */}
                <span className="sr-only">{val} completions</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-[9px] text-center text-gray-600 mt-4 uppercase tracking-widest">
        Touch cells to view daily stats
      </p>
    </div>
  );
};

export default Heatmap;
