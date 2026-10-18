import { Link } from 'react-router-dom';
import { MapPinOff, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-8 relative">
        <MapPinOff size={64} className="text-slate-400" />
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-lg border-4 border-white">
          ?
        </div>
      </div>
      
      <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Страница не найдена</h2>
      <p className="text-slate-500 max-w-md mb-8">
        Похоже, вы свернули не туда. Запрашиваемая страница была удалена, переименована или никогда не существовала.
      </p>
      
      <Link 
        to="/" 
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
      >
        <ArrowLeft size={20} /> Вернуться на главную
      </Link>
    </div>
  );
}