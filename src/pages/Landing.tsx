import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center relative overflow-hidden bg-gray-900">
      {/* Фоновая картинка с наложением */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80")' }}
      />
      
      {/* Контент */}
      <div className="relative z-10 text-center px-4 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
          Добро пожаловать в <span className="text-blue-500">SpaceOS</span>
        </h1>
        <p className="text-xl text-gray-200 mb-10">
          Умная система управления коворкингом. Найдите идеальное рабочее место или переговорную комнату за пару кликов.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/booking" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-transform transform hover:scale-105 shadow-lg"
          >
            Забронировать место
          </Link>
          <Link 
            to="/pricing" 
            className="inline-block bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-8 rounded-full text-lg transition-transform transform hover:scale-105 shadow-lg"
          >
            Узнать тарифы
          </Link>
        </div>
      </div>
    </div>
  );
}