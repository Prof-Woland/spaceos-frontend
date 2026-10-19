import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import BookingCalendarModal from '../components/BookingCalendarModal';
import FloorMap from '../components/FloorMap';
import { Search, Filter, MonitorPlay, Users, LayoutGrid } from 'lucide-react';
import Spinner from '../components/Spinner';

export default function BookingPage() {
  const [selectedResource, setSelectedResource] = useState<{ id: number, name: string } | null>(null);

  // 👇 Стейты для фильтров
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'место' | 'зал'>('all');
  const [hasEquipment, setHasEquipment] = useState(false);

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.get('/resources').then(res => res.data),
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
      <p className="mt-4 text-slate-500 font-medium">Загрузка карты пространства...</p>
    </div>
  );

  // 👇 Логика фильтрации
  const filteredResources = resources?.filter((r: any) => {
    // 1. Поиск по названию
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // 2. Фильтр по типу (место/зал)
    if (typeFilter !== 'all' && r.resourceType !== typeFilter) return false;
    // 3. Фильтр по оборудованию
    if (hasEquipment && (!r.equipment || r.equipment.trim() === '')) return false;
    
    return true;
  }) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Карта пространства</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Найдите идеальное место для работы или встречи.</p>
        </div>
        
      </div>

      {/* 👇 ПАНЕЛЬ ФИЛЬТРОВ */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row gap-4 items-center">
        
        {/* Поиск */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск по названию..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-sm dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Тип */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full md:w-auto">
          <button 
            onClick={() => setTypeFilter('all')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${typeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <LayoutGrid size={16} /> Все
          </button>
          <button 
            onClick={() => setTypeFilter('место')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${typeFilter === 'место' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <MonitorPlay size={16} /> Места
          </button>
          <button 
            onClick={() => setTypeFilter('зал')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${typeFilter === 'зал' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Users size={16} /> Залы
          </button>
        </div>

        {/* Оборудование */}
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 w-full md:w-auto">
          <input 
            type="checkbox" 
            checked={hasEquipment}
            onChange={(e) => setHasEquipment(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          Только с оборудованием
        </label>
      </div>

      {/* Сама карта (передаем отфильтрованные данные) */}
      {filteredResources.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center">
          <Filter size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Ничего не найдено</h3>
          <p className="text-slate-500 dark:text-slate-400">Попробуйте изменить параметры поиска или сбросить фильтры.</p>
        </div>
      ) : (
        <FloorMap 
          resources={filteredResources} 
          onSelect={(res) => setSelectedResource(res)} 
        />
      )}

      {selectedResource && (
        <BookingCalendarModal 
          resourceId={selectedResource.id} 
          resourceName={selectedResource.name} 
          onClose={() => setSelectedResource(null)} 
        />
      )}
    </div>
  );
}