import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Monitor, Laptop, Users, PhoneCall, Sofa, Coffee, Star } from 'lucide-react';

interface Resource {
  id: number;
  name: string;
  status: string;
  resourceType: string;
  capacity: number | null;
  equipment: string | null;
  location: string | null;
  averageRating?: number; // 👈 Новое поле
  reviewCount?: number;   // 👈 Новое поле
}

interface FloorMapProps {
  resources: Resource[];
  onSelect: (resource: { id: number, name: string }) => void;
}

const ResourceCard = ({ res, onSelect }: { res: Resource, onSelect: any }) => {
  const isAvailable = res.status === 'свободен';
  const isMeeting = res.location?.includes('Зона встреч');
  const isFocus = res.location?.includes('Фокус');
  const isLounge = res.location?.includes('Лаунж');
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, showBelow: false });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const showBelow = rect.top < 200; 
      setCoords({
        top: showBelow ? rect.bottom + 8 : rect.top - 8,
        left: rect.left + rect.width / 2,
        showBelow
      });
    }
    setShowTooltip(true);
  };

  let Icon = Monitor;
  let colorClass = 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700';
  let textClass = 'text-emerald-600 dark:text-emerald-400';

  if (isMeeting) {
    Icon = Users;
    colorClass = 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-700';
    textClass = 'text-indigo-600 dark:text-indigo-400';
  } else if (isFocus) {
    Icon = PhoneCall;
    colorClass = 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700';
    textClass = 'text-amber-600 dark:text-amber-400';
  } else if (isLounge) {
    Icon = Sofa;
    colorClass = 'bg-pink-50 border-pink-300 dark:bg-pink-900/20 dark:border-pink-700';
    textClass = 'text-pink-600 dark:text-pink-400';
  } else if (res.equipment?.toLowerCase().includes('монитор')) {
    Icon = Laptop;
  }

  const capacity = res.capacity || 0;
  const topChairs = Math.ceil(capacity / 2);
  const bottomChairs = Math.floor(capacity / 2);

  return (
    <>
      <button
        ref={buttonRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => isAvailable && onSelect({ id: res.id, name: res.name })}
        disabled={!isAvailable}
        className={`
          relative w-full h-full flex flex-col items-center justify-center transition-all duration-200 overflow-hidden p-2
          ${isMeeting ? 'rounded-lg border-4' : 'rounded-md border-2 min-h-[60px]'}
          ${colorClass}
          ${isAvailable 
            ? 'hover:scale-[1.02] hover:shadow-lg hover:border-slate-500 hover:z-30 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed border-red-400 bg-red-100 dark:bg-red-900/20 dark:border-red-800 grayscale'}
        `}
      >
        {/* 👇 Отображение рейтинга в углу карточки */}
        {res.reviewCount && res.reviewCount > 0 ? (
          <div className="absolute top-1 right-1 bg-white/90 dark:bg-slate-800/90 shadow-sm px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-20">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200">{res.averageRating?.toFixed(1)}</span>
          </div>
        ) : null}

        {isMeeting ? (
          <>
            <div className="flex gap-1 justify-center w-full px-2 mb-1">
              {Array.from({ length: topChairs }).map((_, i) => (
                <div key={`top-${i}`} className="w-2.5 h-2.5 bg-slate-400 rounded-full border border-slate-500 shadow-sm"></div>
              ))}
            </div>
            <div className="w-[90%] h-8 bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 rounded flex items-center justify-center z-10">
              <span className="font-bold text-[10px] text-slate-800 dark:text-slate-200 text-center px-1 truncate">{res.name}</span>
            </div>
            <div className="flex gap-1 justify-center w-full px-2 mt-1">
              {Array.from({ length: bottomChairs }).map((_, i) => (
                <div key={`bottom-${i}`} className="w-2.5 h-2.5 bg-slate-400 rounded-full border border-slate-500 shadow-sm"></div>
              ))}
            </div>
          </>
        ) : (
          <>
            <Icon size={18} className={`${textClass} mb-1`} />
            <span className="font-bold text-[10px] sm:text-xs text-slate-800 dark:text-slate-200 text-center leading-tight">{res.name}</span>
          </>
        )}
      </button>

      {showTooltip && createPortal(
        <div 
          style={{ top: coords.top, left: coords.left, transform: `translateX(-50%) ${coords.showBelow ? '' : 'translateY(-100%)'}` }}
          className="fixed z-[9999] w-max min-w-[150px] bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl pointer-events-none border border-slate-700"
        >
          <div className="font-bold text-sm mb-1 flex items-center justify-between gap-4">
            {res.name}
            {/* 👇 Рейтинг в тултипе */}
            {res.reviewCount && res.reviewCount > 0 ? (
              <span className="flex items-center gap-1 text-amber-400">
                <Star size={12} className="fill-amber-400" /> {res.averageRating?.toFixed(1)} ({res.reviewCount})
              </span>
            ) : null}
          </div>
          <div className="text-slate-300">{res.location}</div>
          {res.capacity && <div className="flex items-center gap-1 mt-1 text-slate-300"><Users size={12}/> Вместимость: {res.capacity}</div>}
          {res.equipment && <div className="mt-1 text-slate-300">🔧 {res.equipment}</div>}
          <div className={`mt-2 font-bold ${isAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
            {isAvailable ? 'Свободно' : 'Занято'}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const chunkArrayBalanced = (arr: any[], maxSize: number) => {
  if (arr.length === 0) return [];
  const numChunks = Math.ceil(arr.length / maxSize);
  const chunkSize = Math.ceil(arr.length / numChunks);
  return arr.reduce((acc, _, i) => (i % chunkSize ? acc : [...acc, arr.slice(i, i + chunkSize)]), []);
};

export default function FloorMap({ resources, onSelect }: FloorMapProps) {
  const zoneA = resources.filter(r => r.location?.includes('Зона А'));
  const zoneB = resources.filter(r => r.location?.includes('Зона B'));
  const zoneC = resources.filter(r => r.location?.includes('Зона C'));
  
  const meetingRooms = resources.filter(r => r.location?.includes('Зона встреч'));
  const focusRooms = resources.filter(r => r.location?.includes('Фокус'));
  const loungeDesks = resources.filter(r => r.location?.includes('Лаунж'));

  const podsA = chunkArrayBalanced(zoneA, 4);
  const podsBC = chunkArrayBalanced([...zoneB, ...zoneC], 4);

  return (
    <div className="relative w-full bg-slate-100 dark:bg-slate-900 rounded-3xl border-4 md:border-8 border-slate-800 dark:border-slate-950 shadow-2xl overflow-hidden flex flex-col min-h-[1000px]">
      
      {/* ── 1. РЕСЕПШН ── */}
      <div className="w-full h-20 md:h-24 bg-slate-200 dark:bg-slate-800 border-b-4 border-slate-400 dark:border-slate-700 relative flex items-center justify-between px-4 md:px-10 shrink-0 z-10">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-800 dark:bg-slate-950 text-white rounded-full flex items-center justify-center font-bold text-lg md:text-xl shadow-lg">S</div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest">SpaceOS</h2>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Reception</p>
          </div>
        </div>
        <Coffee size={30} className="text-slate-400 dark:text-slate-600 md:w-10 md:h-10" />
      </div>

      {/* ── 2. ОСНОВНАЯ ЗОНА ── */}
      <div className="flex flex-col md:flex-row flex-1 w-full relative">
        
        {/* ЛЕВОЕ КРЫЛО */}
        <div className="w-full md:w-[40%] flex flex-col border-b-4 md:border-b-0 md:border-r-4 border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-800 relative">
          
          {/* Окна (только ПК) */}
          <div className="hidden md:block absolute top-[10%] left-0 w-2 h-12 bg-blue-300 dark:bg-blue-600 border-r-2 border-blue-400 dark:border-blue-700"></div>
          <div className="hidden md:block absolute top-[30%] left-0 w-2 h-12 bg-blue-300 dark:bg-blue-600 border-r-2 border-blue-400 dark:border-blue-700"></div>
          <div className="hidden md:block absolute top-[50%] left-0 w-2 h-12 bg-blue-300 dark:bg-blue-600 border-r-2 border-blue-400 dark:border-blue-700"></div>
          <div className="hidden md:block absolute top-[70%] left-0 w-2 h-12 bg-blue-300 dark:bg-blue-600 border-r-2 border-blue-400 dark:border-blue-700"></div>

          {/* Зона А */}
          <div className="p-4 border-b-4 border-slate-400 dark:border-slate-700 relative flex-grow flex flex-col">
            <div className="mb-4">
              <span className="bg-slate-800 dark:bg-slate-950 text-white px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase">Зона А</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow content-start">
              {podsA.map((pod: any[], index: number) => (
                <div key={index} className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-3 flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/50 min-h-[150px]">
                  <div className="grid grid-cols-2 gap-2 w-full h-full max-w-[180px]">
                    {pod.map((res: any) => <ResourceCard key={res.id} res={res} onSelect={onSelect} />)}
                  </div>
                  <span className="absolute -top-3 left-2 bg-white dark:bg-slate-800 px-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pod A-{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Зона B/C */}
          <div className="p-4 relative bg-slate-50/50 dark:bg-slate-900/50 flex-grow flex flex-col">
            <div className="mb-4">
              <span className="bg-slate-800 dark:bg-slate-950 text-white px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase">Зона B / C</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow content-start">
              {podsBC.map((pod: any[], index: number) => (
                <div key={index} className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-3 flex items-center justify-center bg-white dark:bg-slate-800 min-h-[150px]">
                  <div className="grid grid-cols-2 gap-2 w-full h-full max-w-[180px]">
                    {pod.map((res: any) => <ResourceCard key={res.id} res={res} onSelect={onSelect} />)}
                  </div>
                  <span className="absolute -top-3 left-2 bg-white dark:bg-slate-800 px-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pod BC-{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* КОРИДОР */}
        <div className="w-full md:w-16 h-12 md:h-auto bg-slate-200 dark:bg-slate-800 flex flex-col md:flex-row items-center justify-center relative shadow-inner shrink-0">
          <span className="text-slate-400 dark:text-slate-600 text-[10px] md:text-xs font-bold md:rotate-90 tracking-[0.4em] whitespace-nowrap">ГЛАВНЫЙ ПРОХОД</span>
          
          {/* Двери (только ПК) */}
          <div className="hidden md:block absolute top-[20%] left-0 w-2 h-8 border-y-4 border-slate-400 dark:border-slate-600 z-0"></div>
          <div className="hidden md:block absolute top-[60%] left-0 w-2 h-8 border-y-4 border-slate-400 dark:border-slate-600 z-0"></div>
        </div>

        {/* ПРАВОЕ КРЫЛО */}
        <div className="w-full md:flex-1 flex flex-col bg-white dark:bg-slate-800 relative">
          
          {/* Фокус-румы */}
          <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 shrink-0">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">Focus Booths</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {focusRooms.map(room => (
                <div key={room.id} className="w-full h-20"><ResourceCard res={room} onSelect={onSelect} /></div>
              ))}
            </div>
          </div>

          {/* Лаунж */}
          <div className="p-4 border-b-4 border-slate-400 dark:border-slate-700 shrink-0 bg-slate-50/30 dark:bg-slate-900/30">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">Lounge Zone</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loungeDesks.map(res => (
                <div key={res.id} className="w-full h-24"><ResourceCard res={res} onSelect={onSelect} /></div>
              ))}
            </div>
          </div>

          {/* Переговорные */}
          <div className="flex-1 p-4 flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center shrink-0">Meeting Rooms</h3>
            
            <div className="flex flex-col gap-3 flex-grow">
              {meetingRooms.map(room => (
                <div
                  key={room.id}
                  style={{ flexGrow: room.capacity || 1 }} 
                  className="w-full md:w-[85%] mx-auto min-h-[90px] flex flex-col shrink-0"
                >
                  <ResourceCard res={room} onSelect={onSelect} />
                </div>
              ))}
            </div>
          </div>

          {/* Окна (только ПК) */}
          <div className="hidden md:block absolute top-[10%] right-0 w-2 h-16 bg-blue-300 dark:bg-blue-600 border-l-2 border-blue-400 dark:border-blue-700"></div>
          <div className="hidden md:block absolute top-[40%] right-0 w-2 h-16 bg-blue-300 dark:bg-blue-600 border-l-2 border-blue-400 dark:border-blue-700"></div>
          <div className="hidden md:block absolute top-[70%] right-0 w-2 h-16 bg-blue-300 dark:bg-blue-600 border-l-2 border-blue-400 dark:border-blue-700"></div>
        </div>

      </div>
    </div>
  );
}