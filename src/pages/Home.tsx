import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import BookingModal from '../components/BookingModal';

export default function Home() {
  const [selectedResource, setSelectedResource] = useState<{ id: number, name: string } | null>(null);

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.get('/resources').then(res => res.data),
  });

  if (isLoading) return <div className="p-8 text-center">Загрузка...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Доступные пространства</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources?.map((resource: any) => (
          <div key={resource.id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{resource.name}</h3>
                <p className="text-sm text-gray-500 uppercase tracking-wide">{resource.resourceType}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                resource.status === 'свободен' ? 'bg-green-100 text-green-800' : 
                resource.status === 'ремонт' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {resource.status}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1 mb-6 flex-grow">
              <p>📍 {resource.location || 'Локация не указана'}</p>
              {resource.capacity && <p>👥 Вместимость: {resource.capacity} чел.</p>}
              {resource.equipment && <p>🔧 {resource.equipment}</p>}
            </div>

            <button 
              onClick={() => setSelectedResource({ id: resource.id, name: resource.name })}
              disabled={resource.status === 'ремонт'}
              className="w-full py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Забронировать
            </button>
          </div>
        ))}
      </div>

      {selectedResource && (
        <BookingModal 
          resourceId={selectedResource.id} 
          resourceName={selectedResource.name} 
          onClose={() => setSelectedResource(null)} 
        />
      )}
    </div>
  );
}