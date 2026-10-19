import { useState } from 'react';
import { api } from '../api/axios';
import { useQueryClient } from '@tanstack/react-query';
import { CreditCard, X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from './Spinner';

interface Props {
  paymentId: number;
  amount: number;
  onClose: () => void;
}

export default function PaymentModal({ paymentId, amount, onClose }: Props) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Имитация задержки сети для реалистичности
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      await api.patch(`/payments/${paymentId}/pay`);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast.success('Оплата прошла успешно!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при оплате');
      setIsProcessing(false);
    }
  };

  // Форматирование номера карты (добавляет пробелы каждые 4 цифры)
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Шапка модалки */}
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-emerald-400" />
            <span className="font-bold">Безопасная оплата</span>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="hover:text-slate-300 transition-colors disabled:opacity-50">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handlePay} className="p-6 md:p-8">
          <div className="text-center mb-8">
            <p className="text-slate-500 text-sm mb-1">К оплате</p>
            <p className="text-4xl font-black text-slate-900">{amount} BYN</p>
          </div>

          {/* Имитация карты */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl shadow-lg mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <CreditCard size={32} className="mb-6 opacity-80" />
            <div className="font-mono text-xl md:text-2xl tracking-widest mb-4">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>
            <div className="flex justify-between text-xs opacity-80">
              <span>ИВАН ИВАНОВ</span>
              <span>{expiry || 'ММ/ГГ'}</span>
            </div>
          </div>

          {/* Поля ввода */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Номер карты</label>
              <input 
                type="text" 
                required
                value={cardNumber} 
                onChange={handleCardChange}
                placeholder="0000 0000 0000 0000"
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Срок действия</label>
                <input 
                  type="text" 
                  required
                  maxLength={5}
                  value={expiry} 
                  onChange={e => setExpiry(e.target.value)}
                  placeholder="ММ/ГГ"
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">CVC</label>
                <input 
                  type="password" 
                  required
                  maxLength={3}
                  value={cvc} 
                  onChange={e => setCvc(e.target.value)}
                  placeholder="•••"
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-md disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {isProcessing ? (
              <><Spinner size="md" color="white" /> Обработка платежа...</>
            ) : (
              `Оплатить ${amount} BYN`
            )}
          </button>
          <p className="text-center text-xs text-slate-400 mt-4">
            Это симуляция платежа. Реальные деньги не списываются.
          </p>
        </form>
      </div>
    </div>
  );
}