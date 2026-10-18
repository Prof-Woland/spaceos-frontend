import { useState } from 'react';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Spinner from '@/components/Spinner';
import toast from 'react-hot-toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const { data } = await api.post('/auth/login', { email, password });
        login(data.accessToken, data.user);
        toast.success(`С возвращением, ${data.user.fullName}!`);
        navigate('/');
      } else {
        const { data } = await api.post('/auth/register', { email, password, fullName });
        login(data.accessToken, data.user);
        toast.success('Аккаунт успешно создан!');
        navigate('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Произошла ошибка';
      setError(msg);
      toast.error(msg); // Показываем и в форме, и в тосте
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? 'Вход в систему' : 'Регистрация'}
        </h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">ФИО</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="mt-1 w-full p-2 border rounded-md" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Пароль</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md" />
          </div>
          
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70">
            {isLoading ? <Spinner size="sm" color="white" /> : null}
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} className="mt-4 w-full text-center text-sm text-blue-600 hover:underline">
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
}