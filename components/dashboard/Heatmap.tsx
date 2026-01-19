
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

  // Define intensity levels based on count (shading increases with more activity)
  // Tracking both daily check-ins and book insights via common studyHistory
  const getIntensityStyles = (count: number) => {
    if (count === 0) return "bg-[var(--heatmap-empty)] border-theme";
    // Thresholds: 1-2, 3-4, 5-6, 7+
    if (count <= 2) return "bg-[var(--gold)] opacity-30 border-[var(--gold)]/20";
    if (count <= 4) return "bg-[var(--gold)] opacity-55 border-[var(--gold)]/40 shadow-sm";
    if (count <= 6) return "bg-[var(--gold)] opacity-80 border-[var(--gold)]/60 shadow-md";
    return "bg-[var(--gold)] opacity-100 shadow-[0_0_12px_var(--gold-muted)] border-[var(--gold)] text-black font-black";
  };

  return (
    <div className="space-y-4 relative">
      {/* Tooltip display */}
      {tooltip && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[var(--gold)] text-black text-[10px] font-bold py-2 px-4 rounded-2xl shadow-xl z-20 animate-in fade-in zoom-in duration-200 flex flex-col items-center whitespace-nowrap min-w-[120px] border border-black/10">
          {tooltip.holidayName && (
            <span className="text-[9px] uppercase tracking-wider border-b border-black/10 pb-1 mb-1 font-black">
              ✨ {tooltip.holidayName}
            </span>
          )}
          <span>{tooltip.count} {tooltip.count === 1 ? 'Insight' : 'Insights'} Gathered</span>
          {tooltip.fastingName && <span className="text-[8px] uppercase opacity-80 mt-0.5 tracking-tighter">Season: {tooltip.fastingName.split(' (')[0]}</span>}
        </div>
      )}

      <div className="grid grid-cols-7 gap-1.5 px-1">
        {WEEK_DAYS.map((d, i) => (
          <span 
            key={i} 
            className="text-[10px] text-center font-black text-[var(--text-muted)] opacity-60"
          >
            {d}
          </span>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1.5">
        {data.map((item, i) => {
          const val = item.count;
          const isToday = item.isToday;
          const isPadding = item.isPadding;
          const fastingColor = item.fastingColor;
          const isMajorHoliday = item.isMajorHoliday;

          let style: React.CSSProperties = {};
          let intensityClass = getIntensityStyles(val);
          let baseClass = `aspect-square rounded-[6px] transition-all relative cursor-help flex items-center justify-center text-[8px] overflow-hidden ${intensityClass} `;

          // Handle Fasting Season styling
          if (fastingColor) {
            if (val === 0) {
              style = { ...style, backgroundColor: `${fastingColor}15`, borderColor: `${fastingColor}35`, borderWidth: '1px' };
            } else {
              style = { ...style, borderBottomColor: fastingColor, borderBottomWidth: '3px' };
            }
          }

          if (isMajorHoliday && !isToday) {
            baseClass += " ring-1 ring-[var(--gold)]/30 ring-offset-1 ring-offset-transparent";
          }

          if (isToday) {
             baseClass += " ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-[var(--bg-primary)] z-10 scale-105";
          }

          return (
            <div 
              key={i} 
              onMouseEnter={() => setTooltip({ index: i, count: val, fastingName: item.fastingName || null, holidayName: item.holidayName || null })}
              onMouseLeave={() => setTooltip(null)}
              onTouchStart={() => setTooltip({ index: i, count: val, fastingName: item.fastingName || null, holidayName: item.holidayName || null })}
              style={style}
              className={`${baseClass} ${isPadding ? 'opacity-10 grayscale-[50%]' : 'opacity-100'} hover:scale-110 active:scale-95`}
            >
              {val > 2 && <span className="pointer-events-none select-none text-black/50 font-black">{val}</span>}
              
              {val === 0 && !isPadding && (
                <>
                  {fastingColor && (
                     <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full" style={{ backgroundColor: fastingColor }} />
                  )}
                  {item.holidayName && (
                    <div className="w-1 h-1 bg-[var(--gold)] rounded-full animate-pulse" />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-4 px-1">
        <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Insight Map</span>
        <div className="flex items-center space-x-1">
           <span className="text-[8px] text-[var(--text-muted)] mr-1">Less</span>
           {[0, 2, 4, 6, 8].map(lvl => (
             <div key={lvl} className={`w-2.5 h-2.5 rounded-[2px] ${getIntensityStyles(lvl)}`} />
           ))}
           <span className="text-[8px] text-[var(--text-muted)] ml-1">More</span>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
