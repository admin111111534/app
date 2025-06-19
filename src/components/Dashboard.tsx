import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, DollarSign, FileText } from 'lucide-react';
import { ReservationItem, WarehouseItem } from '../types';
import './Dashboard.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Helper za lokalni datum iz stringa 'YYYY-MM-DD'
const parseLocalDate = (dateStr: string | undefined | null) => {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return null;
  const [year, month, day] = dateStr.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day));
};

// Helper za lokalni "YYYY-MM-DD" string iz Date objekta
function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Dashboard: React.FC<{
  reservations: ReservationItem[];
  warehouseItems: WarehouseItem[];
}> = ({ reservations, warehouseItems }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Notes state
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<{ [date: string]: string }>({});

  // Modal helpers
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setShowNotes(true);
  };

  const handleSaveNote = (note: string) => {
    if (selectedDate) {
      setNotes(prev => ({
        ...prev,
        [selectedDate]: note
      }));
    }
    setShowNotes(false);
  };

  // Get reservations for current month (bilo koji deo rezervacije u mesecu)
  const currentMonthReservations = useMemo(() => {
    return reservations.filter(reservation => {
      const from = parseLocalDate(reservation.dateFrom);
      const to = parseLocalDate(reservation.dateTo);
      if (!from || !to) return false;
      return (
        (from.getMonth() === currentMonth.getMonth() && from.getFullYear() === currentMonth.getFullYear()) ||
        (to.getMonth() === currentMonth.getMonth() && to.getFullYear() === currentMonth.getFullYear()) ||
        (from < new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) &&
         to >= new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1))
      );
    });
  }, [reservations, currentMonth]);

  // Get upcoming reservations (next 7 days)
  const upcomingReservations = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return reservations
      .filter(reservation => {
        const from = parseLocalDate(reservation.dateFrom);
        const to = parseLocalDate(reservation.dateTo);
        if (!from || !to) return false;
        return (from <= nextWeek && to >= today);
      })
      .sort((a, b) => {
        const aDate = parseLocalDate(a.dateFrom);
        const bDate = parseLocalDate(b.dateFrom);
        if (!aDate || !bDate) return 0;
        return aDate.getTime() - bDate.getTime();
      });
  }, [reservations]);

  // Low stock items (less than 10)
  const lowStockItems = useMemo(() => {
    return warehouseItems.filter(item => item.quantity < 10);
  }, [warehouseItems]);

  // Izračunaj prihod za tekući mesec (suma svih rezervacija u tom mesecu, bez obzira na status)
  const now = new Date();
  const prihodOvajMesec = useMemo(() => {
    return reservations
      .filter(res => {
        const d = parseLocalDate(res.dateFrom); // koristi dateFrom kao datum rezervacije
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, res) => sum + Number(res.totalPrice), 0);
  }, [reservations, now]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startCalendar = new Date(startOfMonth);
    startCalendar.setDate(startCalendar.getDate() - startOfMonth.getDay());

    const days = [];
    const currentDate = new Date(startCalendar);

    for (let i = 0; i < 42; i++) {
      const dateStr = toLocalDateString(currentDate); // KORISTI LOKALNI FORMAT!
      // Da li postoji rezervacija koja pokriva ovaj dan
      const hasReservation = currentMonthReservations.some(r => {
        const from = parseLocalDate(r.dateFrom);
        const to = parseLocalDate(r.dateTo);
        const day = parseLocalDate(dateStr);
        if (!from || !to || !day) return false;
        return day >= from && day <= to;
      });
      const isCurrentMonth = currentDate.getMonth() === currentMonth.getMonth();
      const isToday = dateStr === toLocalDateString(new Date());

      days.push({
        date: dateStr,
        day: currentDate.getDate(),
        hasReservation,
        isCurrentMonth,
        isToday
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];

  const dayNames = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rezervacije ovaj mesec</p>
              <p className="text-2xl font-bold text-gray-900">{currentMonthReservations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Prihod ovaj mesec</p>
              <p className="text-2xl font-bold text-gray-900">
                {prihodOvajMesec.toLocaleString('sr-RS')} RSD
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Narednih 7 dana</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingReservations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Malo zaliha</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateClick(day.date)}
                  className={`
                    p-2 text-sm rounded-lg relative transition-colors
                    ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                    ${day.isToday ? 'bg-blue-100 text-blue-900 font-semibold' : ''}
                    ${selectedDate === day.date ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                  `}
                >
                  {day.day}
                  {day.hasReservation && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Reservations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Naredne rezervacije</h2>
            <div className="space-y-4">
              {upcomingReservations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nema rezervacija u narednih 7 dana</p>
              ) : (
                upcomingReservations.map(reservation => {
                  const from = parseLocalDate(reservation.dateFrom);
                  const to = parseLocalDate(reservation.dateTo);
                  return (
                    <div key={reservation.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{reservation.clientName}</h3>
                        <span className="text-sm text-green-600 font-medium">
                          {reservation.totalPrice.toLocaleString()} RSD
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {reservation.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {from && to
                            ? `${from.toLocaleDateString('sr-RS')} - ${to.toLocaleDateString('sr-RS')} u ${reservation.time}`
                            : 'Nepoznat datum'}
                        </div>
                        {reservation.notes && (
                          <div className="flex items-start">
                            <FileText className="h-4 w-4 mr-2 mt-0.5" />
                            <span className="text-xs">{reservation.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      {showNotes && selectedDate && (
        <div className="modal">
          <h3 className="mb-2">
            Rezervacije za {parseLocalDate(selectedDate)?.toLocaleDateString('sr-RS')}
          </h3>
          {reservations.filter(res => {
            const from = parseLocalDate(res.dateFrom);
            const to = parseLocalDate(res.dateTo);
            const d = parseLocalDate(selectedDate);
            if (!from || !to || !d) return false;
            from.setHours(0,0,0,0);
            to.setHours(0,0,0,0);
            d.setHours(0,0,0,0);
            return from <= d && d <= to;
          }).length === 0 ? (
            <p className="text-gray-500">Nema rezervacija za ovaj dan.</p>
          ) : (
            <ul className="space-y-2">
              {reservations.filter(res => {
                const from = parseLocalDate(res.dateFrom);
                const to = parseLocalDate(res.dateTo);
                const d = parseLocalDate(selectedDate);
                if (!from || !to || !d) return false;
                from.setHours(0,0,0,0);
                to.setHours(0,0,0,0);
                d.setHours(0,0,0,0);
                return from <= d && d <= to;
              }).map(res => (
                <li key={res.id} className="p-2 border rounded">
                  <div><b>Klijent:</b> {res.clientName}</div>
                  <div><b>Lokacija:</b> {res.location}</div>
                  <div><b>Oprema:</b> {res.items.map(i => i.itemName).join(', ')}</div>
                  <div><b>Vreme:</b> {res.time}</div>
                  <div><b>Status:</b> {res.status}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 mt-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowNotes(false)}
            >
              Zatvori
            </button>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-3">Upozorenje - Malo zaliha</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="font-medium text-gray-900">{item.name}</span>
                <span className="text-red-600 font-semibold">{item.quantity} kom</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;