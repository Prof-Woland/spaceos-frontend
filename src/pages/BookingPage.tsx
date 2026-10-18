import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import BookingCalendarModal from '../components/BookingCalendarModal';
import FloorMap from '../components/FloorMap';
import Spinner from '../components/Spinner';

export default function BookingPage() {
  const [selectedResource, setSelectedResource] = useState<{ id: number, name: string } | null>(null);

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.get('/resources').then(res => res.data),
  });

  if (isLoading) return (<div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
      <p className="mt-4 text-slate-500 font-medium">Загрузка карты пространства...</p>
    </div>);

  // Оставляем только ресурсы 1-го этажа для этой карты (ID 1, 2, 5)
  // В идеале, тут можно сделать переключатель этажей (вкладки)
  //const floor1Resources = resources?.filter((r: any) => [1, 2, 5].includes(r.id)) || [];
  const floor1Resources = resources || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Карта этажа</h1>
          <p className="text-gray-500 mt-2">Выберите место для бронирования.</p>
        </div>
      </div>

      <FloorMap 
        resources={floor1Resources} 
        onSelect={(res) => setSelectedResource(res)} 
      />

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