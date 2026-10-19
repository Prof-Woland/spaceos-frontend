import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, Ticket, X, ShieldAlert, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Закрываем профиль при клике вне его области
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Закрываем меню при смене страницы
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const isAdmin = user?.roles?.includes('Администратор') || user?.roles?.includes('Менеджер');
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const navLinks = [
    { name: 'Тарифы', path: '/pricing', requireAuth: false },
    { name: 'Карта', path: '/booking', requireAuth: true },
    { name: 'Мои брони', path: '/my-bookings', requireAuth: true },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* ЛОГОТИП И ССЫЛКИ */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-black text-blue-600 tracking-tighter">SpaceOS</Link>
            
            <div className="hidden md:flex space-x-1">
              {navLinks.map(link => {
                if (link.requireAuth && !user) return null;
                const isActive = location.pathname === link.path;
                return (
                  <Link 
                    key={link.path} 
                    to={link.path}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              
              {isAdmin && (
                <Link 
                  to="/admin"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                    location.pathname.startsWith('/admin') ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <ShieldAlert size={16} /> Админ-панель
                </Link>
              )}
            </div>
          </div>

          {/* ПРОФИЛЬ (DESKTOP) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative" ref={profileRef}>
                
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 pr-3 rounded-full border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                >
                  {/* Аватарка или инициалы */}
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.fullName} 
                      className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700" 
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {initials}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.fullName}</span>
                </button>

                {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {/* Шапка меню с аватаром */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-1 flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {initials}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.fullName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <Link to="/my-bookings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <Ticket size={16} /> Мои брони
                    </Link>
                    
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <User size={16} /> Мой профиль
                    </Link>

                    <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut size={16} /> Выйти из системы
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
                Войти в систему
              </Link>
            )}
          </div>

          {/* КНОПКА МОБИЛЬНОГО МЕНЮ */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* МОБИЛЬНОЕ МЕНЮ */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 pt-2 pb-4 space-y-1 shadow-lg absolute w-full">
          {navLinks.map(link => {
            if (link.requireAuth && !user) return null;
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className="block px-4 py-3 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {link.name}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" className="block px-4 py-3 rounded-lg text-base font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20">
              Админ-панель
            </Link>
          )}
          
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
            {user ? (
              <>
                {/* Инфо о юзере с аватаром в мобилке */}
                <div className="px-4 mb-3 flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{user.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                </div>
                
                <Link to="/profile" className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                  <User size={18} /> Мой профиль
                </Link>

                <button onClick={logout} className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                  <LogOut size={18} /> Выйти
                </button>
              </>
            ) : (
              <Link to="/login" className="block px-4 py-3 text-center bg-blue-600 text-white rounded-lg font-bold">
                Войти
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}