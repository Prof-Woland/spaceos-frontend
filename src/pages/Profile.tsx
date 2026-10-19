import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';
import toast from 'react-hot-toast';
import { User, Lock, CreditCard, Shield } from 'lucide-react';
import Spinner from '../components/Spinner';

export default function Profile() {
  const { user, updateUser } = useAuth();
  
  // Форма личных данных
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(''); // Если у тебя нет телефона в контексте, можно запросить его с бэка
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Форма смены пароля
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const { data } = await api.patch('/users/profile', { fullName, phone });
      // Обновляем контекст (чтобы в шапке поменялось имя)
      updateUser({ ...user!, fullName: data.fullName, roles: data.userRoles.map((ur: any) => ur.role.name) });
      toast.success('Профиль успешно обновлен');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при обновлении');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    try {
      await api.patch('/users/profile', { oldPassword, newPassword });
      toast.success('Пароль успешно изменен');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при смене пароля');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Мой профиль</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Левая колонка: Инфо */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-black">
              {user?.fullName.substring(0, 1).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{user?.fullName}</h2>
            <p className="text-slate-500 text-sm mb-4">{user?.email}</p>
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase">
              <Shield size={14} /> {user?.roles[0] || 'Резидент'}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard size={16} /> Тариф
            </h3>
            <p className="text-lg font-bold text-slate-800">Почасовой</p>
            <p className="text-sm text-slate-500">Оплата по факту использования</p>
          </div>
        </div>

        {/* Правая колонка: Формы */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Личные данные */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-500" /> Личные данные
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ФИО</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Телефон</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" placeholder="+375..." />
                </div>
              </div>
              <button type="submit" disabled={isUpdatingProfile} className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">
                {isUpdatingProfile && <Spinner size="sm" color="white" />} Сохранить изменения
              </button>
            </form>
          </div>

          {/* Смена пароля */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Lock size={20} className="text-red-500" /> Безопасность
            </h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Старый пароль</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Новый пароль</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" required minLength={6} />
              </div>
              <button type="submit" disabled={isUpdatingPassword} className="bg-slate-900 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-50">
                {isUpdatingPassword && <Spinner size="sm" color="white" />} Обновить пароль
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}