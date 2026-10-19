import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import { format, startOfDay, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import Spinner from '../components/Spinner';

const START_HOUR = 8;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR; // 13 часов

export default function AdminTimeline() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => api.get('/bookings').then(res => res.data),
  });

  const { data: resources, isLoading: isLoadingResources } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.get('/resources').then(res => res.data),
  });

  if (isLoadingBookings || isLoadingResources) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const dayBookings = bookings?.filter((b: any) => 
    isSameDay(new Date(b.startDatetime), selectedDate) && b.status !== 'отменена'
  ) || [];

  const hours = Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => i + START_HOUR);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      
      {/* Шапка с выбором даты */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          📅 Расписание на {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
        </h2>
        <input 
          type="date" 
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
        />
      </div>

      {/* Контейнер для горизонтального скролла */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[900px] relative">
          
          {/* Заголовки часов */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-30">
            {/* 👇 Левая колонка с фиксацией (sticky) */}
            <div className="w-32 md:w-48 shrink-0 p-3 font-bold text-xs uppercase text-slate-500 border-r border-slate-200 dark:border-slate-700 flex items-center bg-slate-50 dark:bg-slate-900 sticky left-0 z-40 shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
              Ресурс
            </div>
            
            <div className="flex flex-1 relative">
              {hours.map((hour, index) => (
                <div 
                  key={hour} 
                  className={`flex-1 text-center p-3 text-[10px] md:text-xs font-bold text-slate-400 border-slate-200 dark:border-slate-700 ${index !== hours.length - 1 ? 'border-r' : ''}`}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Строки с ресурсами */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {resources?.map((resource: any) => {
              const resBookings = dayBookings.filter((b: any) => b.resourceId === resource.id);

              return (
                <div key={resource.id} className="flex hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  
                  {/* Название ресурса (Фиксированное) */}
                  <div className="w-32 md:w-48 shrink-0 p-3 md:p-4 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center bg-white dark:bg-slate-800 z-20 sticky left-0 shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                    <span className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 truncate">{resource.name}</span>
                    <span className="text-[9px] md:text-[10px] text-slate-400 uppercase">{resource.resourceType}</span>
                  </div>

                  {/* Сетка времени и брони */}
                  <div className="flex-1 relative flex bg-[url('https://www.transparenttextures.com/patterns/gridme.png')] min-h-[60px] md:min-h-[80px]">
                    
                    {/* Вертикальные линии часов */}
                    {hours.map((hour, index) => (
                      <div 
                        key={hour} 
                        className={`flex-1 border-slate-100 dark:border-slate-700/50 ${index !== hours.length - 1 ? 'border-r' : ''}`}
                      ></div>
                    ))}

                    {/* Блоки броней */}
                    {resBookings.map((booking: any) => {
                      const start = new Date(booking.startDatetime);
                      const end = new Date(booking.endDatetime);
                      
                      const startHour = start.getHours() + start.getMinutes() / 60;
                      const endHour = end.getHours() + end.getMinutes() / 60;
                      
                      const visibleStart = Math.max(startHour, START_HOUR);
                      const visibleEnd = Math.min(endHour, END_HOUR);
                      
                      if (visibleStart >= visibleEnd) return null;

                      const leftPercent = ((visibleStart - START_HOUR) / TOTAL_HOURS) * 100;
                      const widthPercent = ((visibleEnd - visibleStart) / TOTAL_HOURS) * 100;

                      const colorClass = booking.status === 'завершена' 
                        ? 'bg-slate-400 border-slate-500 text-white'
                        : booking.status === 'активна'
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'bg-red-400 border-red-500 text-white';

                      return (
                        <div 
                          key={booking.id}
                          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                          className={`absolute rounded-md border shadow-sm flex items-center px-1.5 md:px-2 overflow-hidden cursor-pointer hover:z-30 hover:scale-[1.02] transition-transform ${colorClass} ${
                            booking.status === 'активна' 
                              ? 'top-1 bottom-1/2 mb-0.5' // Активные сверху
                              : 'bottom-1 top-1/2 mt-0.5 opacity-90' // Завершенные снизу
                          }`}
                          title={`${booking.user.fullName}\n${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}\n${booking.cost} BYN`}
                        >
                          <span className="text-[9px] md:text-[10px] font-bold truncate">
                            {format(start, 'HH:mm')} • {booking.user.fullName.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}