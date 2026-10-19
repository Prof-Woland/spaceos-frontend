import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import { useTheme } from '../context/ThemeContext';
import { LogOut, Menu, Ticket, X, ShieldAlert, User } from 'lucide-react'; // 👈 Добавлен User

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  // const { theme, toggleTheme } = useTheme();

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

  // Закрываем мобильное меню при смене страницы
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
    <nav className="bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* ЛОГОТИП И ДЕСКТОПНЫЕ ССЫЛКИ */}
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
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              
              {/* Ссылка админа */}
              {isAdmin && (
                <Link 
                  to="/admin"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                    location.pathname.startsWith('/admin') ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldAlert size={16} /> Админ-панель
                </Link>
              )}
            </div>
          </div>

          {/* ПРАВАЯ ЧАСТЬ (ПРОФИЛЬ ИЛИ ВХОД) */}
          <div className="hidden md:flex items-center gap-4">
              {/* <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title="Переключить тему"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button> */}
            {user ? (
              <div className="relative" ref={profileRef}>
                

                {/* ВЫПАДАЮЩЕЕ МЕНЮ ПРОФИЛЯ */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b dark:border-slate-800 border-slate-100 mb-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/my-bookings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Ticket size={16} /> Мои брони
                    </Link>
                    
                    {/* 👇 Новая ссылка на профиль */}
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <User size={16} /> Мой профиль
                    </Link>

                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full border border-transparent hover:border-slate-200 transition-all"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {initials}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{user.fullName}</span>
                    </button>

                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-slate-100 pt-3"
                    >
                      <LogOut size={16} /> Выйти из системы
                    </button>
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
              className="text-slate-600 hover:text-slate-900 p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* МОБИЛЬНОЕ МЕНЮ (ВЫЕЗЖАЕТ) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 px-4 pt-2 pb-4 space-y-1 shadow-lg absolute w-full">
          {navLinks.map(link => {
            if (link.requireAuth && !user) return null;
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className="block px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.name}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" className="block px-4 py-3 rounded-lg text-base font-medium text-orange-600 hover:bg-orange-50">
              Админ-панель
            </Link>
          )}
          
          <div className="border-t border-slate-100 pt-4 mt-2">
            {user ? (
              <>
                <div className="px-4 mb-2">
                  <p className="text-sm font-bold text-slate-800">{user.fullName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                
                {/* 👇 Мобильная ссылка на профиль */}
                <Link to="/profile" className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <User size={18} /> Мой профиль
                </Link>

                <button onClick={logout} className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
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