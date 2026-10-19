import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PaymentModal from '../components/PaymentModal';

export default function Pricing() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // 👇 Стейт для выбранного тарифа (для модалки оплаты)
  const [selectedTariff, setSelectedTariff] = useState<any>(null);

  const { data: tariffs, isLoading } = useQuery({
    queryKey: ['tariffs'],
    queryFn: () => api.get('/tariffs').then(res => res.data),
  });

  const handleSelectTariff = (tariff: any) => {
    if (!user) {
      toast.error('Пожалуйста, войдите в систему, чтобы выбрать тариф');
      navigate('/login');
      return;
    }
    
    // Если это уже его текущий тариф — просто перекидываем на карту
    if (user.tariffId === tariff.id) {
      navigate('/booking');
      return;
    }

    // Иначе открываем окно оплаты
    setSelectedTariff(tariff);
  };

  if (isLoading) return <div className="p-8 text-center text-xl font-medium text-slate-500 dark:text-slate-400">Загрузка тарифов...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Простые и прозрачные тарифы</h1>
        <p className="text-xl text-gray-500 dark:text-slate-400">Выберите подходящий формат работы в нашем коворкинге.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {tariffs?.map((tariff: any, index: number) => {
          const isCurrentTariff = user?.tariffId === tariff.id;

          return (
            <div key={tariff.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border p-8 flex flex-col relative transition-all ${
              index === 1 
                ? 'border-blue-500 ring-4 ring-blue-500/20 md:-translate-y-4 shadow-lg' 
                : 'border-slate-200 dark:border-slate-700'
            }`}>
              {index === 1 && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                  Популярный
                </span>
              )}
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tariff.name}</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 h-10">{tariff.description || 'Базовый доступ к пространству'}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{tariff.pricePerMonth}</span>
                <span className="text-gray-500 dark:text-slate-400 font-medium"> BYN / мес</span>
              </div>
              
              <div className="mb-6 border-t border-gray-100 dark:border-slate-700 pt-6">
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Или почасовая оплата:</p>
                <span className="text-2xl font-bold text-gray-800 dark:text-slate-200">{tariff.pricePerHour}</span>
                <span className="text-gray-500 dark:text-slate-400 font-medium"> BYN / час</span>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {['Доступ к рабочим местам', 'Интернет и кофе', 'Бронирование переговорных'].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                    <CheckCircle2 size={18} className="text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleSelectTariff(tariff)}
                disabled={isCurrentTariff}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                  isCurrentTariff 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-default border border-emerald-100 dark:border-emerald-800'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white'
                }`}
              >
                {isCurrentTariff ? (
                  <><ShieldCheck size={18} /> Ваш текущий тариф</>
                ) : (
                  'Выбрать этот тариф'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 👇 Модальное окно оплаты тарифа */}
      {selectedTariff && (
        <PaymentModal 
          amount={Number(selectedTariff.pricePerMonth)}
          description={`Оплата тарифа "${selectedTariff.name}"`}
          onClose={() => setSelectedTariff(null)}
          onSuccess={async () => {
            // Меняем тариф на бэкенде после "успешной оплаты"
            const { data } = await api.patch('/users/profile/tariff', { 
              tariffId: selectedTariff.id 
            });
            
            // Обновляем контекст пользователя (чтобы шапка и профиль обновились)
            updateUser({ 
              ...user!, 
              tariffId: data.tariff.id, 
              tariffName: data.tariff.name 
            });
            
            // Перекидываем на карту для бронирования
            navigate('/booking');
          }}
        />
      )}
    </div>
  );
}