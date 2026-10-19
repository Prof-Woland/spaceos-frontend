import { useState } from 'react';
import { api } from '../api/axios';
import { useQueryClient } from '@tanstack/react-query';
import { Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from './Spinner';

interface Props {
  bookingId: number;
  resourceName: string;
  onClose: () => void;
}

export default function ReviewModal({ bookingId, resourceName, onClose }: Props) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Поставьте оценку');

    setIsSubmitting(true);
    try {
      await api.post('/reviews', { bookingId, rating, comment });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Спасибо за отзыв!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X size={24}/></button>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-1 text-center">Оцените место</h2>
        <p className="text-slate-500 text-center mb-6 text-sm">{resourceName}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Звезды */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star 
                  size={40} 
                  className={`${
                    (hover || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                  } transition-colors`} 
                />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Комментарий (необязательно)</label>
            <textarea 
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Что вам понравилось или не понравилось?"
              className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 min-h-[100px] text-sm resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || rating === 0}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
          >
            {isSubmitting ? <Spinner size="sm" color="white" /> : 'Отправить отзыв'}
          </button>
        </form>
      </div>
    </div>
  );
}