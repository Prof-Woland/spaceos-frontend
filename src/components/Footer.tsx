import { Link } from 'react-router-dom';
import { Coffee, Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t-4 border-blue-600 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Колонка 1: Бренд */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-2xl font-black text-white mb-4 tracking-tighter">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">S</span>
              </div>
              SpaceOS
            </Link>
            <p className="text-sm text-slate-400 mb-6">
              Умная система управления коворкинг-пространством. Найдите идеальное место для работы за пару кликов.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Coffee size={16} /> Кофе включен в тариф
            </div>
          </div>

          {/* Колонка 2: Навигация */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Навигация</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Главная</Link></li>
              <li><Link to="/pricing" className="hover:text-blue-400 transition-colors">Тарифы</Link></li>
              <li><Link to="/booking" className="hover:text-blue-400 transition-colors">Карта пространства</Link></li>
              <li><Link to="/my-bookings" className="hover:text-blue-400 transition-colors">Мои брони</Link></li>
            </ul>
          </div>

          {/* Колонка 3: Контакты */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Контакты</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <span>г. Минск, ул. Программистов, д. 15</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-blue-500 shrink-0" />
                <span>+375 (29) 123-45-67</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-blue-500 shrink-0" />
                <span>hello@spaceos.by</span>
              </li>
            </ul>
          </div>

          {/* Колонка 4: Обратная связь (Псевдо) */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Есть вопросы?</h3>
            <p className="text-sm text-slate-400 mb-4">Напишите нам, и мы поможем с выбором идеального места.</p>
            <a href="mailto:hello@spaceos.by" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700">
              Написать нам <ArrowUpRight size={16} />
            </a>
          </div>

        </div>

        {/* Нижняя полоса с копирайтом */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SpaceOS. Все права защищены.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-white transition-colors">Условия использования</a>
          </div>
        </div>
      </div>
    </footer>
  );
}