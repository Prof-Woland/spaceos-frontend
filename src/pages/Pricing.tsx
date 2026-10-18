import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function Pricing() {
  const { data: tariffs, isLoading } = useQuery({
    queryKey: ['tariffs'],
    queryFn: () => api.get('/tariffs').then(res => res.data),
  });

  if (isLoading) return <div className="p-8 text-center text-xl">Загрузка тарифов...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Простые и прозрачные тарифы</h1>
        <p className="text-xl text-gray-500">Выберите подходящий формат работы в нашем коворкинге.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {tariffs?.map((tariff: any, index: number) => (
          <div key={tariff.id} className={`bg-white rounded-2xl shadow-sm border p-8 flex flex-col ${index === 1 ? 'border-blue-500 ring-4 ring-blue-500/20 relative transform md:-translate-y-4' : ''}`}>
            {index === 1 && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                Популярный
              </span>
            )}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{tariff.name}</h3>
            <p className="text-gray-500 text-sm mb-6 h-10">{tariff.description || 'Базовый доступ к пространству'}</p>
            
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-gray-900">{tariff.pricePerMonth}</span>
              <span className="text-gray-500 font-medium"> BYN / мес</span>
            </div>
            
            <div className="mb-6 border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-500 mb-1">Или почасовая оплата:</p>
              <span className="text-2xl font-bold text-gray-800">{tariff.pricePerHour}</span>
              <span className="text-gray-500 font-medium"> BYN / час</span>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {['Доступ к рабочим местам', 'Интернет и кофе', 'Бронирование переговорных'].map((feature, i) => (
                <li key={i} className="flex items-center text-sm text-gray-600">
                  <CheckCircle2 size={18} className="text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link 
              to="/booking"
              className="w-full block text-center py-3 rounded-lg font-bold transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              Выбрать этот тариф
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}