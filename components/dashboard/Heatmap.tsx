
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
    if (count === 0) return ""; // Handled by inline styles or base background
    if (count <= 1) return "bg-[var(--gold)] opacity-40 border-[var(--gold)]/20";
    if (count <= 2) return "bg-[var(--gold)] opacity-60 border-[var(--gold)]/40 shadow-sm";
    if (count <= 4) return "bg-[var(--gold)] opacity-85 border-[var(--gold)]/60 shadow-md";
    return "bg-[var(--gold)] opacity-100 shadow-[0_0_12px_var(--gold-muted)] border-[var(--gold)] text-black font-black ring-1 ring-[var(--gold)]/50";
  };

  // Find the active fasting season in this month for the legend
  const currentSeason = data.find(d => !d.isPadding && d.fastingName)?.fastingName;
  const currentSeasonColor = data.find(d => !d.isPadding && d.fastingColor)?.fastingColor;

  return (
    <div className="space-y-4 relative">
      {tooltip && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-[var(--bg-secondary)] border border-theme text-[var(--text-primary)] text-[10px] font-bold py-3 px-5 rounded-2xl shadow-2xl z-20 animate-in fade-in zoom-in duration-200 flex flex-col items-center whitespace-nowrap min-w-[140px] backdrop-blur-xl">
          {tooltip.holidayName && (
            <div className="flex flex-col items-center mb-2 pb-2 border-b border-theme w-full">
              <span className="text-[var(--gold)] font-black uppercase tracking-tighter">✨ {tooltip.holidayName}</span>
              <span className="text-[8px] opacity-40 uppercase tracking-widest">Major Holiday</span>
            </div>
          )}
          {tooltip.fastingName && (
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data[tooltip.index].fastingColor || 'transparent' }} />
              <span className="text-[var(--text-muted)] italic">{tooltip.fastingName}</span>
            </div>
          )}
          <span className="font-black">{tooltip.count} {tooltip.count === 1 ? 'Reflection' : 'Reflections'}</span>
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
          const isFasting = !!item.fastingColor;
          
          let baseClass = `aspect-square rounded-[6px] transition-all relative cursor-help flex items-center justify-center text-[8px] overflow-hidden border `;
          
          if (val === 0) {
            baseClass += " border-theme ";
          } else {
            baseClass += getIntensityStyles(val);
          }

          if (item.isToday) baseClass += " ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-[var(--bg-primary)] z-10 scale-105";

          return (
            <div 
              key={i} 
              onMouseEnter={() => setTooltip({ index: i, count: val, fastingName: item.fastingName || null, holidayName: item.holidayName || null })}
              onMouseLeave={() => setTooltip(null)}
              className={`${baseClass} ${item.isPadding ? 'opacity-10 grayscale-[50%]' : 'opacity-100'} hover:scale-110 active:scale-95`}
              style={{ 
                backgroundColor: (val === 0 && isFasting) ? `${item.fastingColor}15` : undefined,
                borderColor: (val === 0 && isFasting) ? `${item.fastingColor}40` : undefined
              }}
            >
              {/* Fasting Indicator Line */}
              {isFasting && val === 0 && (
                <div 
                  className="absolute bottom-0 left-0 w-full h-0.5" 
                  style={{ backgroundColor: item.fastingColor || 'transparent' }} 
                />
              )}

              {/* Major Holiday Marker - Adaptive Theme Colors */}
              {item.isMajorHoliday && (
                <div 
                  className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full opacity-80 bg-[var(--gold)] shadow-[0_0_4px_var(--gold)]" 
                />
              )}

              {val > 2 && <span className="pointer-events-none select-none text-black/50 font-black">{val}</span>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col space-y-3 mt-4 px-1">
        {currentSeason && (
          <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-left-2 duration-700">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentSeasonColor || 'transparent' }} />
            <span className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)] italic">{currentSeason}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Insight Intensity</span>
          <div className="flex items-center space-x-1">
             <span className="text-[8px] text-[var(--text-muted)] mr-1">Less</span>
             <div className="w-2.5 h-2.5 rounded-[2px] bg-[var(--heatmap-empty)] border border-theme" />
             <div className="w-2.5 h-2.5 rounded-[2px] bg-[var(--gold)] opacity-40" />
             <div className="w-2.5 h-2.5 rounded-[2px] bg-[var(--gold)] opacity-70" />
             <div className="w-2.5 h-2.5 rounded-[2px] bg-[var(--gold)]" />
             <span className="text-[8px] text-[var(--text-muted)] ml-1">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
