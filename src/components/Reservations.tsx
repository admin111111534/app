import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, DollarSign, FileText } from 'lucide-react';
import { ReservationItem, WarehouseItem } from '../types';
import ReservationForm from './ReservationForm';

interface ReservationsProps {
  reservations: ReservationItem[];
  warehouseItems: WarehouseItem[];
  addReservation: (reservation: Omit<ReservationItem, 'id'>) => Promise<void>;
  updateReservation: (id: string, data: Partial<ReservationItem>) => Promise<void>;
  deleteReservation: (reservationId: string) => Promise<void>;
  finishReservation: (id: string) => Promise<void>;
}

const Reservations: React.FC<ReservationsProps> = ({
  reservations,
  warehouseItems,
  addReservation,
  updateReservation,
  deleteReservation,
  finishReservation
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReservations = reservations.filter(reservation =>
    (reservation.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (reservation.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleAddOrUpdateReservation = async (reservationData: Omit<ReservationItem, 'id'>) => {
    if (editingReservation) {
      await updateReservation(editingReservation.id, reservationData);
    } else {
      await addReservation(reservationData);
    }
    setShowForm(false);
    setEditingReservation(null);
  };

  const handleDeleteReservation = async (reservation: ReservationItem) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovu rezervaciju?')) {
      await deleteReservation(reservation.id);
    }
  };

  const handleEditReservation = (reservation: ReservationItem) => {
    setEditingReservation(reservation);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingReservation(null);
  };

  if (showForm) {
    return (
      <ReservationForm
        warehouseItems={warehouseItems}
        onSubmit={handleAddOrUpdateReservation}
        onCancel={handleCancelForm}
        editingReservation={editingReservation}
        sveRezervacije={reservations}
        finishReservation={finishReservation} // Dodaj ovu liniju
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rezervacije</h1>
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova rezervacija
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <input
          type="text"
          placeholder="Pretraži po imenu klijenta ili lokaciji..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Reservations List */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nema rezervacija</h3>
            <p className="text-gray-500 mb-6">Početak je uvek težak, dodajte prvu rezervaciju!</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova rezervacija
            </button>
          </div>
        ) : (
          filteredReservations
            .sort((a, b) => new Date(b.dateFrom || '').getTime() - new Date(a.dateFrom || '').getTime())
            .map(reservation => (
              <div key={reservation.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{reservation.clientName}</h3>
                      <div className="flex items-center mt-2 sm:mt-0">
                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-lg font-bold text-green-600">
                          {(reservation.totalPrice ?? 0).toLocaleString()} RSD
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {reservation.location}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {reservation.dateFrom
                          ? `${new Date(reservation.dateFrom).toLocaleDateString('sr-RS')} - ${new Date(reservation.dateTo).toLocaleDateString('sr-RS')}`
                          : ''}
                        {reservation.time && ` u ${reservation.time}`}
                      </div>
                    </div>

                    {reservation.notes && (
                      <div className="flex items-start text-gray-600 mb-4">
                        <FileText className="h-4 w-4 mr-2 mt-0.5" />
                        <span className="text-sm">{reservation.notes}</span>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Rezervisana oprema:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Array.isArray(reservation.items) && reservation.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{item.itemName}</span>
                            <span className="font-medium text-gray-900">{item.quantity} kom</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 mt-4 lg:mt-0 lg:ml-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditReservation(reservation)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Izmeni rezervaciju"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReservation(reservation)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Obriši rezervaciju"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {reservation.status !== 'finished' ? (
                      <button
                        onClick={() => finishReservation(reservation.id)}
                        className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Završi
                      </button>
                    ) : (
                      <span className="mt-2 px-3 py-1 bg-gray-200 text-gray-600 rounded text-sm">Završena</span>
                    )}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Reservations;