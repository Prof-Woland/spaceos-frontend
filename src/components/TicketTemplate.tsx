import { QRCode } from 'react-qr-code';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MapPin } from 'lucide-react';
import { forwardRef } from 'react';

interface TicketProps {
  booking: any;
}

// Используем forwardRef, чтобы передать ref на этот блок из родительского компонента
export const TicketTemplate = forwardRef<HTMLDivElement, TicketProps>(({ booking }, ref) => {
  if (!booking) return null;
  
  const startDate = new Date(booking.startDatetime);
  const endDate = new Date(booking.endDatetime);

  return (
    // Стили заданы жестко (без Tailwind), так как html2canvas иногда плохо читает современные CSS-переменные
    <div 
      ref={ref} 
      style={{
        width: '800px', height: '350px', backgroundColor: '#ffffff', 
        display: 'flex', fontFamily: 'Arial, sans-serif', 
        border: '2px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden'
      }}
    >
      {/* Левая часть (Основная) */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' }}>SpaceOS</div>
          </div>
          
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 10px 0' }}>{booking.resource.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '16px' }}>
            <MapPin size={18} /> {booking.resource.location}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '40px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Дата</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{format(startDate, 'd MMMM yyyy', { locale: ru })}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Время</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Стоимость</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{booking.cost} BYN</div>
          </div>
        </div>
      </div>

      {/* Линия перфорации */}
      <div style={{ width: '2px', borderLeft: '2px dashed #cbd5e1', margin: '20px 0' }}></div>

      {/* Правая часть (QR-код) */}
      <div style={{ width: '250px', backgroundColor: '#f8fafc', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
        <QRCode value={booking.bookingCode || `BOOKING-${booking.id}`} size={140} fgColor="#0f172a" />
        <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px', color: '#0f172a' }}>
          {booking.bookingCode || `#${booking.id}`}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
          Покажите этот QR-код на ресепшене для входа
        </div>
      </div>
    </div>
  );
});