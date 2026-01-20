
import React, { useState } from 'react';
import { WEEK_DAYS } from '../../constants';

interface HeatmapItem {
  count: number;
  isToday: boolean;
  isPadding?: boolean;
  fastingColor?: string | null;
  fastingName?: string | null;
  holidayName?: string | null;
  isMajorHoliday?: boolean;
}

interface Props {
  data: HeatmapItem[];
}

const Heatmap: React.FC<Props> = ({ data }) => {
  const [tooltip, setTooltip] = useState<{index: number, count: number, fastingName: string | null, holidayName: string | null} | null>(null);

  // 5-level intensity shading scale
  const getIntensityStyles = (count: number) => {
    if (count === 0) return "bg-[var(--heatmap-empty)] border-theme";
    if (count <= 1) return "bg-[var(--gold)] opacity-30 border-[var(--gold)]/20";
    if (count <= 2) return "bg-[var(--gold)] opacity-55 border-[var(--gold)]/40 shadow-sm";
    if (count <= 4) return "bg-[var(--gold)] opacity-80 border-[var(--gold)]/60 shadow-md";
    // Highest level with a glow effect
    return "bg-[var(--gold)] opacity-100 shadow-[0_0_12px_var(--gold-muted)] border-[var(--gold)] text-black font-black ring-1 ring-[var(--gold)]/50";
  };

  return (
    <div className="space-y-4 relative">
      {tooltip && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[var(--gold)] text-black text-[10px] font-bold py-2 px-4 rounded-2xl shadow-xl z-20 animate-in fade-in zoom-in duration-200 flex flex-col items-center whitespace-nowrap min-w-[120px] border border-black/10">
          {tooltip.holidayName && <span className="text-[9px] uppercase tracking-wider border-b border-black/10 pb-1 mb-1 font-black">✨ {tooltip.holidayName}</span>}
          <span>{tooltip.count} {tooltip.count === 1 ? 'Insight' : 'Insights'} Gathered</span>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1.5 px-1">
        {WEEK_DAYS.map((d, i) => (
          <span key={i} className="text-[10px] text-center font-black text-[var(--text-muted)] opacity-60">{d}</span>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1.5">
        {data.map((item, i) => {
          const val = item.count;
          let baseClass = `aspect-square rounded-[6px] transition-all relative cursor-help flex items-center justify-center text-[8px] overflow-hidden ${getIntensityStyles(val)} `;
          
          if (item.isToday) baseClass += " ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-[var(--bg-primary)] z-10 scale-105";

          return (
            <div 
              key={i} 
              onMouseEnter={() => setTooltip({ index: i, count: val, fastingName: item.fastingName || null, holidayName: item.holidayName || null })}
              onMouseLeave={() => setTooltip(null)}
              className={`${baseClass} ${item.isPadding ? 'opacity-10 grayscale-[50%]' : 'opacity-100'} hover:scale-110 active:scale-95`}
            >
              {val > 2 && <span className="pointer-events-none select-none text-black/50 font-black">{val}</span>}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-4 px-1">
        <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Insight Map</span>
        <div className="flex items-center space-x-1">
           <span className="text-[8px] text-[var(--text-muted)] mr-1">Less</span>
           {[0, 1, 2, 4, 6].map(lvl => (
             <div key={lvl} className={`w-2.5 h-2.5 rounded-[2px] ${getIntensityStyles(lvl)}`} />
           ))}
           <span className="text-[8px] text-[var(--text-muted)] ml-1">More</span>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
