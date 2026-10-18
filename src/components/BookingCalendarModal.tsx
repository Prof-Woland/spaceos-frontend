import { useState, useMemo } from 'react';
import { api } from '../api/axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addDays, addHours, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock, Calendar as CalendarIcon, Check, X, Coffee, Plus, Minus } from 'lucide-react';
import Spinner from './Spinner';
import toast from 'react-hot-toast';

interface Props {
  resourceId: number;
  resourceName: string;
  onClose: () => void;
}

export default function BookingCalendarModal({ resourceId, resourceName, onClose }: Props) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(1);
  const [selectedServices, setSelectedServices] = useState<Record<number, number>>({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dates = useMemo(() => Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i)), []);
  const timeSlots = useMemo(() => Array.from({ length: 13 }).map((_, i) => `${String(i + 8).padStart(2, '0')}:00`), []);
  const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 8];

  // Получаем доп. услуги
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(res => res.data),
  });

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // Получаем занятые слоты
  const { data: bookedSlots } = useQuery({
    queryKey: ['booked-slots', resourceId, dateStr],
    queryFn: () => api.get(`/bookings/resource/${resourceId}?date=${dateStr}`).then(res => res.data),
  });

  const isSlotBooked = (timeStr: string) => {
    if (!bookedSlots) return false;
    const slotStart = new Date(`${dateStr}T${timeStr}:00`).getTime();
    const slotEnd = slotStart + 60 * 60 * 1000;
    return bookedSlots.some((b: any) => {
      const bStart = new Date(b.startDatetime).getTime();
      const bEnd = new Date(b.endDatetime).getTime();
      return slotStart < bEnd && slotEnd > bStart;
    });
  };

  const isRangeAvailable = (startTimeStr: string, durationHours: number) => {
    if (!bookedSlots) return true;
    const startHour = parseInt(startTimeStr.split(':')[0], 10);
    const endHour = startHour + durationHours;
    if (endHour > 21) return false;

    const startTs = new Date(`${dateStr}T${startTimeStr}:00`).getTime();
    const endTs = startTs + durationHours * 60 * 60 * 1000;

    return !bookedSlots.some((b: any) => {
      const bStart = new Date(b.startDatetime).getTime();
      const bEnd = new Date(b.endDatetime).getTime();
      return startTs < bEnd && endTs > bStart;
    });
  };

  // Хелпер для изменения количества услуг
  const handleServiceChange = (id: number, delta: number) => {
    setSelectedServices(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  // Считаем общую стоимость выбранных услуг
  const totalServicesCost = Object.entries(selectedServices).reduce((acc, [id, qty]) => {
    const service = services?.find((s: any) => s.id === Number(id));
    return acc + (service ? Number(service.price) * qty : 0);
  }, 0);

  const handleSubmit = async () => {
    if (!selectedTime) return;
    setError('');
    setIsSubmitting(true);

    try {
      const startObj = new Date(`${dateStr}T${selectedTime}:00`);
      const endObj = addHours(startObj, duration);

      // Формируем массив услуг для бэкенда
      const servicesPayload = Object.entries(selectedServices).map(([id, qty]) => ({
        serviceId: Number(id),
        quantity: qty,
      }));

      await api.post('/bookings', {
        resourceId,
        startDatetime: startObj.toISOString(),
        endDatetime: endObj.toISOString(),
        services: servicesPayload, // 👈 Отправляем на бэкенд
      });
      
      queryClient.invalidateQueries({ queryKey: ['booked-slots', resourceId, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Место успешно забронировано!');
      
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при бронировании');
      toast.error(err.response?.data?.message || 'Ошибка при бронировании');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row">
        
        {/* ЛЕВАЯ ЧАСТЬ: КАЛЕНДАРЬ */}
        <div className="bg-gray-50 p-8 md:w-1/3 border-r flex flex-col h-[700px]">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
            <CalendarIcon size={20} /> Дата
          </h3>
          <div className="space-y-2 overflow-y-auto pr-2 flex-grow custom-scrollbar p-1">
            {dates.map((date) => {
              const isSelected = format(date, 'yyyy-MM-dd') === dateStr;
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                  className={`w-full text-left px-5 py-3 rounded-xl transition-all ${
                    isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium capitalize">{format(date, 'EEEE', { locale: ru })}</div>
                  <div className="text-lg font-bold">{format(date, 'd MMMM', { locale: ru })}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: ВРЕМЯ, ДЛИТЕЛЬНОСТЬ И УСЛУГИ */}
        <div className="p-8 md:w-2/3 flex flex-col h-[700px] relative">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{resourceName}</h3>
              <p className="text-gray-500">Выберите время, длительность и доп. услуги</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

          <div className="overflow-y-auto custom-scrollbar flex-grow pr-2">
            {/* ВРЕМЯ */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock size={16} /> Доступное время (до 21:00)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {timeSlots.map(time => {
                  const booked = isSlotBooked(time);
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      disabled={booked}
                      onClick={() => { setSelectedTime(time); setDuration(1); }}
                      className={`py-3 rounded-lg text-sm font-bold border-2 transition-all ${
                        booked ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed line-through' :
                        isSelected ? 'bg-green-500 border-green-500 text-white shadow-md' :
                        'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedTime && (
              <>
                {/* ДЛИТЕЛЬНОСТЬ */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Длительность</label>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_OPTIONS.map(h => {
                      const available = isRangeAvailable(selectedTime, h);
                      return (
                        <button
                          key={h}
                          type="button"
                          disabled={!available}
                          onClick={() => setDuration(h)}
                          className={`flex-1 min-w-[3.5rem] py-2.5 rounded-lg text-sm font-bold border transition-all ${
                            !available 
                              ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed line-through' 
                              : duration === h 
                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {h} ч.
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Coffee size={16} /> Дополнительные услуги
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {services?.map((service: any) => {
                      const qty = selectedServices[service.id] || 0;
                      return (
                        <div key={service.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                          <div>
                            <div className="font-semibold text-sm text-slate-800">{service.name}</div>
                            <div className="text-xs text-slate-500">{service.price} BYN</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleServiceChange(service.id, -1)}
                              disabled={qty === 0}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-bold text-sm w-4 text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleServiceChange(service.id, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {services?.length === 0 && (
                      <div className="text-center text-sm text-slate-400 py-2">Доп. услуги недоступны</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* КНОПКА БРОНИРОВАНИЯ */}
          {selectedTime && (
            <div className="mt-auto pt-4 border-t border-gray-100 bg-white">
              {totalServicesCost > 0 && (
                <div className="flex justify-between items-center mb-3 text-sm text-slate-600">
                  <span>Стоимость доп. услуг:</span>
                  <span className="font-bold">{totalServicesCost} BYN</span>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="md" color="white" /> Оформление...
                  </>
                ) : (
                  <>
                    <Check size={20} /> Забронировать {selectedTime} ({duration} ч.)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}