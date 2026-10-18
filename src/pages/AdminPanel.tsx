import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, Trash2, ShieldAlert, Monitor, Users, TrendingUp, DollarSign, CalendarCheck } from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, CheckCircle } from 'lucide-react'; // Добавь QrCode и CheckCircle

const COLORS = ['#10b981', '#ef4444', '#64748b'];

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'stats' | 'bookings' | 'resources' | 'scanner'>('stats');
    const [scannedBooking, setScannedBooking] = useState<any>(null);

  const [newResource, setNewResource] = useState({
    name: '', resourceType: 'место', location: 'Зона А, 1 этаж', capacity: '', equipment: ''
  });

  // Запросы данных
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/bookings/admin/stats').then(res => res.data),
  });

  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => api.get('/bookings').then(res => res.data),
  });

  const { data: resources, isLoading: isLoadingResources } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.get('/resources').then(res => res.data),
  });

  // Мутации
  const createResourceMutation = useMutation({
    mutationFn: (data: any) => api.post('/resources', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setNewResource({ name: '', resourceType: 'место', location: 'Зона А, 1 этаж', capacity: '', equipment: '' });
      toast.success('Ресурс успешно добавлен!');
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Ресурс удален');
    }
  });

    const checkInMutation = useMutation({
    mutationFn: (code: string) => api.patch(`/bookings/check-in/${code}`),
    onSuccess: (data: any) => {
      console.log('Ответ от бэкенда:', data); // 👈 Посмотри это в консоли!
      
      // Умный парсинг: ищем объект брони, где бы он ни лежал
      let bookingData = data;
      if (data.booking) bookingData = data.booking; // Если бэкенд вернул { message, booking }
      if (data.data) bookingData = data.data; // Если бэкенд вернул { data: { ... } }
      
      setScannedBooking(bookingData);
      
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Ошибка при сканировании');
    }
  });

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    createResourceMutation.mutate({
      ...newResource,
      capacity: newResource.capacity ? Number(newResource.capacity) : null,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Панель управления</h1>
          <p className="text-slate-500">Аналитика, управление ресурсами и бронями</p>
        </div>
      </div>

      {/* Вкладки админки */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6 overflow-x-auto">
        <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'stats' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          Аналитика
        </button>
        <button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'bookings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          Все бронирования
        </button>
        <button onClick={() => setActiveTab('scanner')} className={`px-4 py-2 font-bold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'scanner' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <QrCode size={18} /> Сканер QR
        </button>
        <button onClick={() => setActiveTab('resources')} className={`px-4 py-2 font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'resources' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          Ресурсы
        </button>
      </div>

      {/* ── ВКЛАДКА 1: АНАЛИТИКА ── */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {isLoadingStats ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Spinner size="lg" />
              <p className="mt-4 text-slate-500 font-medium">Сбор статистики...</p>
            </div>
          ) : (
            <>
              {/* KPI Карточки */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <DollarSign size={32} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Фактическая выручка</p>
                    <p className="text-4xl font-black text-slate-900">{stats?.totalRevenue} BYN</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <CalendarCheck size={32} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Всего броней</p>
                    <p className="text-4xl font-black text-slate-900">{stats?.totalBookings}</p>
                  </div>
                </div>
              </div>

              {/* Графики */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-slate-400" /> Статусы броней
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats?.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {stats?.statusData.map((index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-slate-400" /> Топ-5 популярных мест
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.topResources} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                        <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                        <Bar dataKey="count" name="Количество броней" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ВКЛАДКА 2: БРОНИ ── */}
      {activeTab === 'bookings' && (
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         {isLoadingBookings ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Spinner size="lg" />
              <p className="mt-4 text-slate-500 font-medium">Загрузка броней...</p>
            </div>
         ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Клиент</th>
                <th className="p-4 font-semibold">Ресурс</th>
                <th className="p-4 font-semibold">Дата и время</th>
                <th className="p-4 font-semibold">Статус</th>
                <th className="p-4 font-semibold text-right">Стоимость</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings?.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-mono text-xs text-slate-400">{b.bookingCode || b.id}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{b.user.fullName}</div>
                    <div className="text-xs text-slate-500">{b.user.email}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-700">{b.resource.name}</td>
                  <td className="p-4 text-slate-600">
                    {format(new Date(b.startDatetime), 'd MMM, HH:mm', { locale: ru })} — {format(new Date(b.endDatetime), 'HH:mm')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      b.status === 'активна' ? 'bg-emerald-100 text-emerald-700' : 
                      b.status === 'отменена' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900">{b.cost} BYN</td>
                </tr>
              ))}
            </tbody>
          </table>
         )}
       </div>
      )}

       {activeTab === 'scanner' && (
        <div className="max-w-xl mx-auto">
          <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-200 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Сканирование билетов</h2>
            <p className="text-sm text-slate-500 mb-8">
              Наведите камеру на QR-код с телефона клиента, чтобы подтвердить его вход.
            </p>
            
            <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-2xl border-4 border-slate-800 shadow-xl bg-black mb-8">
              <Scanner 
                // 👇 ВОТ ГЛАВНЫЙ ФИКС: ставим сканер на паузу, если открыта модалка
                paused={!!scannedBooking || checkInMutation.isPending}
                onScan={(result) => {
                  if (result && result[0]?.rawValue) {
                    if (checkInMutation.isPending || scannedBooking) return;
                    checkInMutation.mutate(result[0].rawValue);
                  }
                }} 
                components={{ finder: true }}
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <CheckCircle size={16} className="text-emerald-500" />
              Камера автоматически распознает код и подтвердит клиента
            </div>
          </div>
          
          {/* МОДАЛКА УСПЕШНОГО СКАНИРОВАНИЯ */}
          {scannedBooking && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                
                <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">Вход разрешен!</h3>
                <p className="text-center text-slate-500 mb-6">Бронь успешно подтверждена</p>
                
                               <div className="bg-slate-50 rounded-2xl p-5 space-y-4 mb-8 border border-slate-100">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-slate-500 text-sm">Клиент</span>
                    <span className="font-bold text-slate-900">{scannedBooking.user?.fullName || 'Не указан'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-slate-500 text-sm">Помещение</span>
                    <span className="font-bold text-slate-900">{scannedBooking.resource?.name || 'Не указано'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-slate-500 text-sm">Вместимость</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {scannedBooking.resource?.capacity ? `${scannedBooking.resource.capacity} чел.` : '1 чел.'}
                    </span>
                  </div>
                  
                  {/* 👇 Железобетонная защита от краша Safari */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Время</span>
                    <span className="font-bold text-slate-900">
                      {scannedBooking.startDatetime && scannedBooking.endDatetime 
                        ? `${format(new Date(scannedBooking.startDatetime), 'HH:mm')} — ${format(new Date(scannedBooking.endDatetime), 'HH:mm')}`
                        : 'Время не указано'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setScannedBooking(null)}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Пропустить группу
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ВКЛАДКА 4: РЕСУРСЫ ── */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Добавить ресурс</h2>
            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Название</label>
                <input required type="text" value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Тип</label>
                <select value={newResource.resourceType} onChange={e => setNewResource({...newResource, resourceType: e.target.value})} className="w-full p-2 border rounded-lg text-sm">
                  <option value="место">Рабочее место</option>
                  <option value="зал">Переговорная / Зал</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Локация</label>
                <input required type="text" value={newResource.location} onChange={e => setNewResource({...newResource, location: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <button type="submit" disabled={createResourceMutation.isPending} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700">
                Создать
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {isLoadingResources ? (
               <div className="flex flex-col items-center justify-center py-32">
                 <Spinner size="lg" />
                 <p className="mt-4 text-slate-500 font-medium">Загрузка ресурсов...</p>
               </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4 font-semibold">Название</th>
                    <th className="p-4 font-semibold">Тип</th>
                    <th className="p-4 font-semibold">Локация</th>
                    <th className="p-4 font-semibold text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                        {r.resourceType === 'зал' ? <Users size={16} className="text-indigo-500"/> : <Monitor size={16} className="text-emerald-500"/>}
                        {r.name}
                      </td>
                      <td className="p-4 text-slate-600 capitalize">{r.resourceType}</td>
                      <td className="p-4 text-slate-600">{r.location}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => { if(window.confirm('Удалить?')) deleteResourceMutation.mutate(r.id) }} className="text-red-400 hover:text-red-600 p-2">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}