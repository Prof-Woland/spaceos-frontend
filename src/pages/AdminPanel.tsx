import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Plus, Trash2, ShieldAlert, Monitor, Users, TrendingUp, 
  DollarSign, CalendarCheck, QrCode, CheckCircle, Search, Wrench, Check, 
  Clock, Crown, FileSpreadsheet, FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Scanner } from '@yudiel/react-qr-scanner';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import AdminTimeline from '@/components/AdminTimeline';

const COLORS = ['#10b981', '#ef4444', '#64748b']; 

export default function AdminPanel() {
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'stats' | 'timeline' | 'bookings' | 'resources' | 'users' | 'scanner'>('stats');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');

  const [newResource, setNewResource] = useState({
    name: '', resourceType: 'место', location: 'Зона А, 1 этаж', capacity: '', equipment: ''
  });

  const [scannedBooking, setScannedBooking] = useState<any>(null);

  // ─── ЗАПРОСЫ ДАННЫХ ───
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

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/users').then(res => res.data),
  });

  // ─── МУТАЦИИ ───
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

  const updateResourceStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      api.patch(`/resources/${id}`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      const msg = variables.status === 'ремонт' ? 'Ресурс отправлен в ремонт' : 'Ресурс доступен для брони';
      toast.success(msg);
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (code: string) => api.patch(`/bookings/check-in/${code}`),
    onSuccess: (response: any) => {
      const resData = response.data;
      const bookingData = resData.booking ? resData.booking : resData;
      setScannedBooking(bookingData);
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Ошибка при сканировании');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roleName }: { id: number, roleName: string }) => api.patch(`/users/${id}/role`, { roleName }),
    onSuccess: () => {
      toast.success('Роль пользователя обновлена');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('Пользователь удален');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Ошибка удаления (возможно, есть активные брони)');
    }
  });

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    createResourceMutation.mutate({
      ...newResource,
      capacity: newResource.capacity ? Number(newResource.capacity) : null,
    });
  };

  const downloadCSV = () => {
    if (!bookings || bookings.length === 0) return toast.error('Нет данных для экспорта');

    const headers = ['Код', 'Клиент', 'Email', 'Ресурс', 'Дата', 'Время', 'Стоимость (BYN)', 'Статус'];
    
    const csvRows = bookings.map((b: any) => {
      const date = format(new Date(b.startDatetime), 'dd.MM.yyyy');
      const time = `${format(new Date(b.startDatetime), 'HH:mm')}-${format(new Date(b.endDatetime), 'HH:mm')}`;
      
      return [
        b.bookingCode || b.id,
        `"${b.user.fullName}"`,
        b.user.email,
        `"${b.resource.name}"`,
        date,
        time,
        b.cost,
        b.status
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Отчет_брони_${format(new Date(), 'dd.MM.yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Фильтрация
  const filteredBookings = bookings?.filter((b: any) => 
    b.bookingCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredResources = resources?.filter((r: any) => 
    r.name.toLowerCase().includes(resourceSearchQuery.toLowerCase()) || 
    r.location?.toLowerCase().includes(resourceSearchQuery.toLowerCase())
  ) || [];

  const downloadPDF = () => {
    if (!filteredBookings || filteredBookings.length === 0) {
      return toast.error('Нет данных для экспорта');
    }

    const doc = new jsPDF();
    
    // Заголовок
    doc.setFontSize(18);
    doc.text('Отчет по бронированиям SpaceOS', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Дата формирования: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 30);
    doc.text(`Всего записей: ${filteredBookings.length}`, 14, 35);

    // Формируем данные для таблицы
    const tableData = filteredBookings.map((b: any) => [
      b.bookingCode || b.id,
      b.user.fullName,
      b.resource.name,
      format(new Date(b.startDatetime), 'dd.MM.yyyy'),
      `${format(new Date(b.startDatetime), 'HH:mm')} - ${format(new Date(b.endDatetime), 'HH:mm')}`,
      `${b.cost} BYN`,
      b.status
    ]);

    // Рисуем таблицу
    autoTable(doc, {
      startY: 40,
      head: [['Код', 'Клиент', 'Ресурс', 'Дата', 'Время', 'Стоимость', 'Статус']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    });

    doc.save(`SpaceBOS_Отчет_${format(new Date(), 'dd.MM.yyyy')}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Панель управления</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Аналитика, управление ресурсами и пользователями</p>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto custom-scrollbar pb-1">
        <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'stats' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}>Аналитика</button>
        <button onClick={() => setActiveTab('timeline')} className={`px-4 py-2 font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'timeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}>Гант</button>
        <button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'bookings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}>Брони</button>
        <button onClick={() => setActiveTab('resources')} className={`px-4 py-2 font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'resources' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}>Ресурсы</button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-bold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}><Users size={18} /> Пользователи</button>
        <button onClick={() => setActiveTab('scanner')} className={`px-4 py-2 font-bold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'scanner' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}><QrCode size={18} /> Сканер</button>
      </div>

      {/* ── ВКЛАДКА 1: АНАЛИТИКА ── */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {isLoadingStats ? (
            <div className="flex flex-col items-center justify-center py-32"><Spinner size="lg" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><DollarSign size={32} /></div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Выручка</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{Number(stats?.totalRevenue || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} BYN</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><CalendarCheck size={32} /></div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Всего броней</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{stats?.totalBookings}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0"><TrendingUp size={32} /></div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Средний чек</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{Number(stats?.averageCheck || 0).toFixed(2)} BYN</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-slate-400" /> Выручка за 7 дней</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.revenueByDay} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip formatter={(value: any) => [`${Number(value).toFixed(2)} BYN`, 'Выручка']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wider"><Clock size={16} className="text-slate-400" /> Пиковые часы</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.peakHours} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="time" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} interval={2} />
                        <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                        <Bar dataKey="count" name="Броней" fill="#f59e0b" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wider"><TrendingUp size={16} className="text-slate-400" /> Статусы</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats?.statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" isAnimationActive={false}>
                          {stats?.statusData.map((_: any, index: number) => (<Cell key={`cell-${index}`} style={{ fill: COLORS[index % COLORS.length] }} />))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wider"><Monitor size={16} className="text-slate-400" /> Топ мест</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.topResources} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" allowDecimals={false} tick={{fontSize: 10}} axisLine={false} tickLine={false}/>
                        <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                        <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                        <Bar dataKey="count" name="Броней" barSize={16} radius={[0, 4, 4, 0]} isAnimationActive={false} style={{ fill: '#3b82f6' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mt-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><DollarSign size={20} className="text-slate-400" /> Выручка по ресурсам (Топ-5)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.revenueByResource} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{fill: '#f1f5f9'}} formatter={(value: any) => [`${value} BYN`, 'Выручка']} />
                      <Bar dataKey="revenue" name="Выручка" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider"><Crown size={16} className="text-amber-500" /> Самые активные клиенты</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats?.topClients.map((client: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
                      {idx === 0 && <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">VIP</div>}
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0">{idx + 1}</div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{client.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{client.count} броней</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="font-black text-emerald-600 dark:text-emerald-400">{client.totalSpent} BYN</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ВКЛАДКА 2: ГАНТ ── */}
      {activeTab === 'timeline' && <AdminTimeline />}

      {/* ── ВКЛАДКА 3: БРОНИРОВАНИЯ ── */}
      {activeTab === 'bookings' && (
         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col xl:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full xl:w-auto">
              <Search size={20} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Поиск по ФИО, Email или коду..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full xl:w-64 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-2">
              <button onClick={downloadCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                <FileSpreadsheet size={16} /> В Excel
              </button>
              <button onClick={downloadPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                <FileText size={16} /> В PDF
              </button>
            </div>
          </div>

         {isLoadingBookings ? (
            <div className="flex flex-col items-center justify-center py-32"><Spinner size="lg" /></div>
         ) : (
          <>
            {/* Десктопная таблица */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4 font-semibold">Код</th>
                    <th className="p-4 font-semibold">Клиент</th>
                    <th className="p-4 font-semibold">Ресурс</th>
                    <th className="p-4 font-semibold">Дата и время</th>
                    <th className="p-4 font-semibold">Статус</th>
                    <th className="p-4 font-semibold text-right">Стоимость</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredBookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                      <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400 font-bold">{b.bookingCode || b.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-white">{b.user.fullName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{b.user.email}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{b.resource.name}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {format(new Date(b.startDatetime), 'd MMM, HH:mm', { locale: ru })} — {format(new Date(b.endDatetime), 'HH:mm')}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          b.status === 'активна' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                          b.status === 'отменена' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>{b.status}</span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900 dark:text-white">{b.cost} BYN</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Мобильные карточки (Брони) */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              {filteredBookings.map((b: any) => (
                <div key={b.id} className="p-4 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white">{b.user.fullName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{b.user.email}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      b.status === 'активна' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                      b.status === 'отменена' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>{b.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{b.resource.name}</span>
                    <span className="font-mono text-xs text-slate-400">{b.bookingCode || b.id}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {format(new Date(b.startDatetime), 'd MMM, HH:mm', { locale: ru })} — {format(new Date(b.endDatetime), 'HH:mm')}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{b.cost} BYN</span>
                  </div>
                </div>
              ))}
            </div>
          </>
         )}
       </div>
      )}

      {/* ── ВКЛАДКА 4: РЕСУРСЫ ── */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Plus size={18}/> Добавить ресурс</h2>
            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Название</label>
                <input required type="text" value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500 bg-transparent text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Тип</label>
                <select value={newResource.resourceType} onChange={e => setNewResource({...newResource, resourceType: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  <option value="место">Рабочее место</option>
                  <option value="зал">Переговорная / Зал</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Локация</label>
                <input required type="text" value={newResource.location} onChange={e => setNewResource({...newResource, location: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500 bg-transparent text-slate-900 dark:text-white" />
              </div>
              {newResource.resourceType === 'зал' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Вместимость (чел.)</label>
                  <input type="number" value={newResource.capacity} onChange={e => setNewResource({...newResource, capacity: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500 bg-transparent text-slate-900 dark:text-white" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Оборудование</label>
                <input type="text" value={newResource.equipment} onChange={e => setNewResource({...newResource, equipment: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500 bg-transparent text-slate-900 dark:text-white" placeholder="Монитор..." />
              </div>
              <button type="submit" disabled={createResourceMutation.isPending} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex justify-center items-center h-10">
                {createResourceMutation.isPending ? <Spinner size="sm" color="white" /> : 'Создать'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center gap-3">
              <Search size={20} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Поиск по названию или локации..." 
                value={resourceSearchQuery}
                onChange={(e) => setResourceSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
              />
            </div>

            {isLoadingResources ? (
               <div className="flex flex-col items-center justify-center py-32"><Spinner size="lg" /></div>
            ) : (
              <>
                {/* Десктопная таблица (Ресурсы) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-4 font-semibold">Название</th>
                        <th className="p-4 font-semibold">Статус</th>
                        <th className="p-4 font-semibold text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredResources.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                          <td className="p-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {r.resourceType === 'зал' ? <Users size={16} className="text-indigo-500"/> : <Monitor size={16} className="text-emerald-500"/>}
                            {r.name}
                            <span className="text-[10px] text-slate-400 font-normal ml-2">{r.location}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              r.status === 'свободен' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                              r.status === 'занят' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>{r.status}</span>
                          </td>
                          <td className="p-4 text-right flex items-center justify-end gap-2">
                            {r.status === 'ремонт' ? (
                              <button onClick={() => updateResourceStatusMutation.mutate({ id: r.id, status: 'свободен' })} className="flex items-center gap-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                <Check size={14} /> Разрешить
                              </button>
                            ) : (
                              <button onClick={() => updateResourceStatusMutation.mutate({ id: r.id, status: 'ремонт' })} className="flex items-center gap-1 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                <Wrench size={14} /> В ремонт
                              </button>
                            )}
                            <button onClick={() => { if(window.confirm('Удалить ресурс?')) deleteResourceMutation.mutate(r.id) }} className="text-red-400 hover:text-red-600 p-2 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Мобильные карточки (Ресурсы) */}
                <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredResources.map((r: any) => (
                    <div key={r.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          {r.resourceType === 'зал' ? <Users size={16} className="text-indigo-500 mt-0.5"/> : <Monitor size={16} className="text-emerald-500 mt-0.5"/>}
                          <div>
                            <div className="font-bold text-slate-800 dark:text-white">{r.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.location}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 ${
                          r.status === 'свободен' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                          r.status === 'занят' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>{r.status}</span>
                      </div>
                      
                      <div className="flex justify-end items-center gap-2 mt-1">
                        {r.status === 'ремонт' ? (
                          <button onClick={() => updateResourceStatusMutation.mutate({ id: r.id, status: 'свободен' })} className="flex items-center gap-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 px-3 py-2 rounded-lg text-xs font-bold transition-colors">
                            <Check size={14} /> Разрешить
                          </button>
                        ) : (
                          <button onClick={() => updateResourceStatusMutation.mutate({ id: r.id, status: 'ремонт' })} className="flex items-center gap-1 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 px-3 py-2 rounded-lg text-xs font-bold transition-colors">
                            <Wrench size={14} /> В ремонт
                          </button>
                        )}
                        <button onClick={() => { if(window.confirm('Удалить ресурс?')) deleteResourceMutation.mutate(r.id) }} className="text-red-400 hover:text-red-600 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ВКЛАДКА 5: ПОЛЬЗОВАТЕЛИ ── */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {isLoadingUsers ? (
             <div className="flex flex-col items-center justify-center py-32"><Spinner size="lg" /></div>
          ) : (
            <>
              {/* Десктопная таблица (Пользователи) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-4 font-semibold">ФИО</th>
                      <th className="p-4 font-semibold">Email</th>
                      <th className="p-4 font-semibold">Роль</th>
                      <th className="p-4 font-semibold text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {users?.map((u: any) => {
                      const currentRole = u.userRoles[0]?.role?.name || 'Резидент';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                          <td className="p-4 font-bold text-slate-800 dark:text-white">{u.fullName}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                          <td className="p-4">
                            <select 
                              value={currentRole}
                              onChange={(e) => updateRoleMutation.mutate({ id: u.id, roleName: e.target.value })}
                              className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 outline-none cursor-pointer"
                            >
                              <option value="Резидент">Резидент</option>
                              <option value="Менеджер">Менеджер</option>
                              <option value="Администратор">Администратор</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => { if(window.confirm('Удалить пользователя?')) deleteUserMutation.mutate(u.id) }} className="text-red-400 hover:text-red-600 p-2 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Мобильные карточки (Пользователи) */}
              <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
                {users?.map((u: any) => {
                  const currentRole = u.userRoles[0]?.role?.name || 'Резидент';
                  return (
                    <div key={u.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white">{u.fullName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{u.email}</div>
                        </div>
                        <button onClick={() => { if(window.confirm('Удалить пользователя?')) deleteUserMutation.mutate(u.id) }} className="text-red-400 hover:text-red-600 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="mt-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Роль пользователя</label>
                        <select 
                          value={currentRole}
                          onChange={(e) => updateRoleMutation.mutate({ id: u.id, roleName: e.target.value })}
                          className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none cursor-pointer"
                        >
                          <option value="Резидент">Резидент</option>
                          <option value="Менеджер">Менеджер</option>
                          <option value="Администратор">Администратор</option>
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ВКЛАДКА 6: СКАНЕР ── */}
      {activeTab === 'scanner' && (
        <div className="max-w-xl mx-auto">
          <div className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Сканирование билетов</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Наведите камеру на QR-код с телефона клиента.</p>
            
            <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-2xl border-4 border-slate-800 dark:border-slate-950 shadow-xl bg-black mb-8">
              <Scanner 
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

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CheckCircle size={16} className="text-emerald-500" />
              Камера автоматически распознает код
            </div>
          </div>
          
          {scannedBooking && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                
                <h3 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">Вход разрешен!</h3>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-6">Бронь успешно подтверждена</p>
                
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 space-y-4 mb-6 border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Клиент</span>
                    <span className="font-bold text-slate-900 dark:text-white">{scannedBooking.user?.fullName || 'Не указан'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Помещение</span>
                    <span className="font-bold text-slate-900 dark:text-white">{scannedBooking.resource?.name || 'Не указано'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Время</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {scannedBooking.startDatetime && scannedBooking.endDatetime 
                        ? `${format(new Date(scannedBooking.startDatetime), 'HH:mm')} — ${format(new Date(scannedBooking.endDatetime), 'HH:mm')}`
                        : 'Время не указано'}
                    </span>
                  </div>
                </div>

                {scannedBooking.payment?.status === 'оплачено' ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-center justify-center gap-2 mb-6 font-bold">
                    <CheckCircle size={20} /> Бронь оплачена
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 p-4 rounded-xl mb-6">
                    <div className="flex items-center justify-center gap-2 font-bold mb-1">
                      <DollarSign size={20} /> Не оплачено!
                    </div>
                    <p className="text-xs text-center opacity-80">
                      Клиент должен оплатить {scannedBooking.cost} BYN.
                    </p>
                  </div>
                )}

                <button onClick={() => setScannedBooking(null)} className="w-full bg-slate-900 dark:bg-slate-700 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors">
                  Пропустить группу
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}