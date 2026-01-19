
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

  return (
    <div className="space-y-4 relative">
      {/* Tooltip display */}
      {tooltip && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#d4af37] text-black text-[10px] font-bold py-2 px-4 rounded-2xl shadow-xl z-20 animate-in fade-in zoom-in duration-200 flex flex-col items-center whitespace-nowrap min-w-[120px]">
          {tooltip.holidayName && (
            <span className="text-[9px] uppercase tracking-wider border-b border-black/10 pb-1 mb-1 font-black">
              ✨ {tooltip.holidayName}
            </span>
          )}
          <span>{tooltip.count} {tooltip.count === 1 ? 'Reading' : 'Readings'} Completed</span>
          {tooltip.fastingName && <span className="text-[8px] uppercase opacity-80 mt-0.5 tracking-tighter">Fast: {tooltip.fastingName.split(' (')[0]}</span>}
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
          const isToday = item.isToday;
          const isPadding = item.isPadding;
          const fastingColor = item.fastingColor;
          const isMajorHoliday = item.isMajorHoliday;

          // Determine the box background style
          let baseClass = "";
          let style: React.CSSProperties = {};

          if (val > 0) {
            if (val === 1) baseClass = "bg-[#d4af37]/30 border border-[#d4af37]/10";
            else if (val === 2) baseClass = "bg-[#d4af37]/60 border border-[#d4af37]/20";
            else baseClass = "bg-[#d4af37] shadow-[0_0_10px_#d4af37]";
            
            if (fastingColor) {
              style = { ...style, borderColor: fastingColor, borderWidth: '2px' };
            }
          } else {
            if (fastingColor) {
              style = { ...style, backgroundColor: `${fastingColor}22`, borderColor: `${fastingColor}44`, borderWidth: '1px' };
            } else {
              baseClass = "bg-white/5 border border-white/5";
            }
          }

          // Override for major holidays - subtle gold ring
          if (isMajorHoliday && !isToday) {
            baseClass += " ring-1 ring-[#d4af37]/30";
          }

          // Override for "Today" - purely border indicator
          if (isToday) {
             baseClass += " ring-2 ring-[#d4af37] ring-offset-2 ring-offset-black z-10 scale-110 shadow-[0_0_15px_rgba(212,175,55,0.3)]";
          }

          return (
            <div 
              key={i} 
              onMouseEnter={() => setTooltip({ index: i, count: val, fastingName: item.fastingName || null, holidayName: item.holidayName || null })}
              onMouseLeave={() => setTooltip(null)}
              onTouchStart={() => setTooltip({ index: i, count: val, fastingName: item.fastingName || null, holidayName: item.holidayName || null })}
              style={style}
              className={`aspect-square rounded-[4px] transition-all relative cursor-help group ${baseClass} ${
                isPadding ? 'opacity-20 grayscale' : 'opacity-100'
              } hover:scale-110 active:scale-95`}
            >
              {/* If fasting and no progress, add a small dot of the color */}
              {fastingColor && val === 0 && (
                <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full" style={{ backgroundColor: fastingColor }} />
              )}
              {/* If it's a holiday but no progress, a tiny gold spark */}
              {item.holidayName && val === 0 && !isPadding && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 bg-[#d4af37] rounded-full animate-pulse" />
                </div>
              )}
              
              <span className="sr-only">{val} completions</span>
            </div>
          );
        })}
      </div>
      <p className="text-[8px] text-center text-gray-600 mt-2 uppercase tracking-[0.2em]">
        Touch cells for history
      </p>
    </div>
  );
};

export default Heatmap;
