import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import BookingPage from './pages/BookingPage';
import MyBookings from './pages/MyBookings';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Profile from './pages/Profile';

// Обертка для страниц с навбаром и футером
const MainLayout = () => (
  // flex-col и min-h-screen нужны, чтобы футер всегда прижимался к низу
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Navbar />
    {/* flex-grow заставляет контент занимать всё свободное место */}
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const ProtectedRoute = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ 
        style: { background: '#333', color: '#fff', borderRadius: '10px' } 
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Все страницы внутри MainLayout получат Навбар и Футер */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          {/* 👇 Ловит все несуществующие URL */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}