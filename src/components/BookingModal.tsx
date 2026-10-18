import { useState } from 'react';
import { api } from '../api/axios';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface Props {
  resourceId: number;
  resourceName: string;
  onClose: () => void;
}

export default function BookingModal({ resourceId, resourceName, onClose }: Props) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [selectedServices, setSelectedServices] = useState<Record<number, number>>({});
  const [error, setError] = useState('');
  
  const queryClient = useQueryClient();

  // Загружаем список доступных услуг
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(res => res.data),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const servicesArray = Object.entries(selectedServices)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({ serviceId: Number(id), quantity: qty }));

      await api.post('/bookings', {
        resourceId,
        startDatetime: new Date(start).toISOString(),
        endDatetime: new Date(end).toISOString(),
        services: servicesArray,
      });
      
      // Обновляем кэш броней и закрываем окно
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] }); // <--- ДОБАВИТЬ ЭТО
      onClose();
      alert('Успешно забронировано!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при бронировании');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-xl font-bold mb-4">Бронирование: {resourceName}</h3>
        
        {error && <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Начало</label>
              <input type="datetime-local" required value={start} onChange={e => setStart(e.target.value)}
                className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Конец</label>
              <input type="datetime-local" required value={end} onChange={e => setEnd(e.target.value)}
                className="w-full p-2 border rounded-md" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Дополнительные услуги</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded-md">
              {services?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between">
                  <span className="text-sm">{s.name} ({s.price} BYN)</span>
                  <input type="number" min="0" value={selectedServices[s.id] || 0}
                    onChange={(e) => setSelectedServices({...selectedServices, [s.id]: Number(e.target.value)})}
                    className="w-16 p-1 border rounded text-center" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
              Отмена
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Забронировать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}