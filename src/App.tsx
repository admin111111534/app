import { useState, useEffect } from 'react';
import { Calendar, Package, FileText, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Reservations from './components/Reservations';
import Warehouse from './components/Warehouse';
import { ReservationItem, WarehouseItem } from './types';
import { db } from './firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Firestore state
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);

  // Real-time sync for warehouse
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), (snapshot) => {
      setWarehouseItems(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<WarehouseItem, 'id'>)
        }))
      );
    });
    return () => unsub();
  }, []);

  // Real-time sync for reservations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reservations"), (snapshot) => {
      setReservations(
        snapshot.docs.map(doc => {
          const data = doc.data() as any; // <-- koristi 'any' ovde
          return {
            id: doc.id,
            ...data,
            dateFrom: data.dateFrom || data.date || '',
            dateTo: data.dateTo || data.date || '',
          };
        })
      );
    });
    return () => unsub();
  }, []);

  // CRUD helpers for warehouse
  const addWarehouseItem = async (item: Omit<WarehouseItem, 'id'>) => {
    await addDoc(collection(db, "inventory"), item);
  };

  const updateWarehouseItem = async (id: string, data: Partial<WarehouseItem>) => {
    await updateDoc(doc(db, "inventory", id), data);
  };

  const deleteWarehouseItem = async (id: string) => {
    await deleteDoc(doc(db, "inventory", id));
  };

  // CRUD helpers for reservations
  const addReservation = async (reservation: Omit<ReservationItem, 'id'>) => {
    await addDoc(collection(db, "reservations"), reservation);
  };

  const updateReservation = async (id: string, data: Partial<ReservationItem>) => {
    await updateDoc(doc(db, "reservations", id), data);
  };

  const deleteReservation = async (id: string) => {
    await deleteDoc(doc(db, "reservations", id));
  };

  // Dodavanje rezervacije + automatsko smanjenje količine u magacinu
  const handleAddReservation = async (reservation: Omit<ReservationItem, 'id'>) => {
    await addReservation(reservation);
    // Smanji količinu za svaki artikal iz rezervacije
    for (const item of reservation.items) {
      const warehouseItem = warehouseItems.find(w => w.id === item.itemId);
      if (warehouseItem) {
        await updateWarehouseItem(warehouseItem.id, {
          quantity: warehouseItem.quantity - item.quantity
        });
      }
    }
  };

  // Brisanje rezervacije + vraćanje količine u magacin
  const handleDeleteReservation = async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (reservation) {
      for (const item of reservation.items) {
        const warehouseItem = warehouseItems.find(w => w.id === item.itemId);
        if (warehouseItem) {
          await updateWarehouseItem(warehouseItem.id, {
            quantity: warehouseItem.quantity + item.quantity
          });
        }
      }
    }
    await deleteReservation(reservationId);
  };

  // Završavanje rezervacije
  const handleFinishReservation = async (id: string) => {
    await updateReservation(id, { status: 'finished' });
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Glavna strana', icon: Calendar },
    { id: 'reservations', label: 'Rezervacije', icon: FileText },
    { id: 'warehouse', label: 'Magacin', icon: Package }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            reservations={reservations}
            warehouseItems={warehouseItems}
          />
        );
      case 'reservations':
        return (
          <Reservations
            reservations={reservations}
            warehouseItems={warehouseItems}
            addReservation={handleAddReservation}
            updateReservation={updateReservation}
            deleteReservation={handleDeleteReservation}
            finishReservation={handleFinishReservation} // <-- dodaj ovo
          />
        );
      case 'warehouse':
        return (
          <Warehouse
            warehouseItems={warehouseItems}
            reservations={reservations} // <-- dodaj ovo!
            addWarehouseItem={addWarehouseItem}
            updateWarehouseItem={updateWarehouseItem}
            deleteWarehouseItem={deleteWarehouseItem}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">MiImamoSve</h1>
            </div>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;