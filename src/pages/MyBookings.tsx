import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { Link } from 'react-router-dom';
import { 
  Calendar, MapPin, Monitor, Users, PhoneCall, Sofa, 
  XCircle, CheckCircle2, Ticket, ArrowRight, CreditCard, Info, Coffee, Download
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TicketTemplate } from '../components/TicketTemplate';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import Skeleton from '@/components/Skeleton';

export default function MyBookings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  
  // 👇 ХУКИ ДЛЯ PDF И ГЕНЕРАЦИИ (должны быть в самом верху!)
  const ticketRef = useRef<HTMLDivElement>(null);
  const [printBooking, setPrintBooking] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings/my').then(res => res.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/bookings/${id}/cancel`),
    onSuccess: (_, cancelledBookingId) => {
      queryClient.setQueryData(['my-bookings'], (oldBookings: any) => {
        if (!oldBookings) return oldBookings;
        return oldBookings.map((b: any) => 
          b.id === cancelledBookingId ? { ...b, status: 'отменена' } : b
        );
      });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Бронь отменена');
    },
  });

  // 👇 ТЕПЕРЬ МОЖНО ДЕЛАТЬ РАННИЙ ВОЗВРАТ
  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <Skeleton className="h-10 w-64 mb-8" />
      <div className="flex gap-2 mb-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="flex flex-col md:flex-row h-48 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="w-full md:w-64 bg-slate-50 p-6 border-r border-slate-100 flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-24 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Функция генерации PDF
  const downloadTicket = async (booking: any) => {
    setIsGeneratingPdf(true);
    setPrintBooking(booking); // Монтируем компонент билета в скрытый DOM
    
    // Ждем 100мс, чтобы React успел отрисовать билет
    setTimeout(async () => {
      if (!ticketRef.current) {
        setIsGeneratingPdf(false);
        return;
      }
      
      try {
        const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [800, 350]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 800, 350);
        pdf.save(`SpaceOS-Билет-${booking.bookingCode || booking.id}.pdf`);
      } catch (error) {
        toast.error('Не удалось сгенерировать PDF');
        console.error(error);
      } finally {
        setPrintBooking(null); // Убираем компонент из DOM
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const activeBookings = bookings?.filter((b: any) => b.status === 'активна') || [];
  const historyBookings = bookings?.filter((b: any) => b.status !== 'активна') || [];
  const currentBookings = activeTab === 'active' ? activeBookings : historyBookings;

  const getIcon = (booking: any) => {
    const loc = booking.resource.location || '';
    if (loc.includes('Зона встреч')) return <Users size={24} className="text-indigo-500" />;
    if (loc.includes('Фокус')) return <PhoneCall size={24} className="text-amber-500" />;
    if (loc.includes('Лаунж')) return <Sofa size={24} className="text-pink-500" />;
    return <Monitor size={24} className="text-emerald-500" />;
  };

  const getDurationText = (start: string, end: string) => {
    const diffMins = differenceInMinutes(new Date(end), new Date(start));
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h > 0 ? h + ' ч. ' : ''}${m > 0 ? m + ' мин.' : ''}`.trim();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Личный кабинет</h1>
      
      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl mb-8 w-fit">
        <button onClick={() => setActiveTab('active')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Активные ({activeBookings.length})
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          История ({historyBookings.length})
        </button>
      </div>

      {currentBookings.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Ticket size={32} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Здесь пока пусто</h3>
          <p className="text-slate-500 mb-6 max-w-sm">
            {activeTab === 'active' ? 'У вас нет активных броней. Самое время найти идеальное место!' : 'В истории пока нет завершенных броней.'}
          </p>
          {activeTab === 'active' && (
            <Link to="/booking" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
              Перейти к карте <ArrowRight size={18} />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {currentBookings.map((booking: any) => {
            const startDate = new Date(booking.startDatetime);
            const endDate = new Date(booking.endDatetime);
            const isActive = booking.status === 'активна';

            return (
              <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row relative">
                
                {/* ЛЕВАЯ ЧАСТЬ: QR-код и Время */}
                <div className={`p-6 md:w-64 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r-2 border-dashed ${isActive ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-slate-100 opacity-70'}`}>
                  
                  {isActive && (
                    <div className="bg-white p-2 rounded-xl shadow-sm mb-4 border border-slate-200">
                      <QRCode value={booking.bookingCode || `BOOKING-${booking.id}`} size={90} fgColor="#0f172a" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-slate-500 mb-1 font-semibold text-xs uppercase tracking-wider text-center">
                    <Calendar size={14} /> {format(startDate, 'd MMMM, EEEE', { locale: ru })}
                  </div>
                  <div className="text-xl font-black text-slate-800">
                    {format(startDate, 'HH:mm')} — {format(endDate, 'HH:mm')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">
                    {getDurationText(booking.startDatetime, booking.endDatetime)}
                  </div>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: Детали */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                        {getIcon(booking)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 flex flex-wrap items-center gap-2">
                          {booking.resource.name}
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 tracking-wider">
                            {booking.bookingCode || `#${booking.id}`}
                          </span>
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin size={14} /> 
                            {booking.resource.location || 'Локация не указана'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} /> 
                            {booking.resource.capacity ? `до ${booking.resource.capacity} чел.` : 'Индивидуальное место'}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded w-fit border border-slate-100">
                          <Info size={12} /> {booking.resource.equipment || 'Оборудование не указано'}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm mt-auto border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-1 text-slate-600 font-medium">
                      <CreditCard size={16} className={booking.payment?.status === 'оплачено' ? 'text-emerald-500' : 'text-amber-500'} />
                      {booking.payment?.status === 'оплачено' ? 'Оплачено' : 'Ожидает оплаты'}
                    </div>
                    
                    <div className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-xs font-semibold">
                      <Coffee size={12} />
                      {booking.bookingServices?.length > 0 
                        ? `+ Услуги: ${booking.bookingServices.map((bs: any) => bs.service.name).join(', ')}`
                        : 'Доп. услуги отсутствуют'}
                    </div>

                    <div className="ml-auto font-black text-lg text-slate-900">
                      {booking.cost} BYN
                    </div>
                  </div>
                </div>

                {/* ПРАВАЯ ПАНЕЛЬ ДЕЙСТВИЙ (Скачать / Отменить) */}
                {isActive && (
                  <div className="flex md:flex-col border-t md:border-t-0 md:border-l border-slate-100 shrink-0 md:w-16">
                    {/* Кнопка скачивания PDF */}
                    <button
                      onClick={() => downloadTicket(booking)}
                      disabled={isGeneratingPdf && printBooking?.id === booking.id}
                      className="flex-1 flex items-center justify-center py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer group disabled:opacity-50"
                      title="Скачать билет (PDF)"
                    >
                      {isGeneratingPdf && printBooking?.id === booking.id ? (
                        <Spinner size="sm" color="slate" />
                      ) : (
                        <Download size={20} className="group-hover:scale-110 transition-transform" />
                      )}
                    </button>

                    {/* Кнопка отмены */}
                    <button
                      onClick={() => {
                        toast((t) => (
                          <div className="flex flex-col gap-3">
                            <span className="font-bold text-sm">Отменить эту бронь?</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => { toast.dismiss(t.id); cancelMutation.mutate(booking.id); }}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              >
                                Да, отменить
                              </button>
                              <button 
                                onClick={() => toast.dismiss(t.id)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              >
                                Нет
                              </button>
                            </div>
                          </div>
                        ), { duration: 5000, position: 'top-center' });
                      }}
                      disabled={cancelMutation.isPending}
                      className="flex-1 flex items-center justify-center py-3 bg-red-50 hover:bg-red-100 text-red-500 transition-colors cursor-pointer group disabled:opacity-50"
                      title="Отменить бронь"
                    >
                      {cancelMutation.isPending && cancelMutation.variables === booking.id ? (
                        <Spinner size="sm" color="red" />
                      ) : (
                        <XCircle size={20} className="group-hover:scale-110 transition-transform" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 👇 Скрытый контейнер для рендера PDF */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <TicketTemplate ref={ticketRef} booking={printBooking} />
      </div>
    </div>
  );
}