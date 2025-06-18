import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { ReservationItem, WarehouseItem, ReservationItemDetail } from '../types';

interface ReservationFormProps {
  warehouseItems: WarehouseItem[];
  onSubmit: (reservation: Omit<ReservationItem, 'id'>) => void;
  onCancel: () => void;
  editingReservation?: ReservationItem | null;
  sveRezervacije: ReservationItem[]; // Add this line
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  warehouseItems,
  onSubmit,
  onCancel,
  editingReservation,
  sveRezervacije // Add this line
}) => {
  const initialDate = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    clientName: '',
    location: '',
    dateFrom: initialDate || '',
    dateTo: initialDate || '',
    time: '',
    totalPrice: 0,
    notes: ''
  });

  const [selectedItems, setSelectedItems] = useState<ReservationItemDetail[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editingReservation) {
      setFormData({
        clientName: editingReservation.clientName,
        location: editingReservation.location,
        dateFrom: editingReservation.dateFrom,
        dateTo: editingReservation.dateTo,
        time: editingReservation.time,
        totalPrice: editingReservation.totalPrice,
        notes: editingReservation.notes || ''
      });
      setSelectedItems(editingReservation.items);
    }
  }, [editingReservation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalPrice' ? Number(value) : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addItem = () => {
    setSelectedItems(prev => [
      ...prev,
      { itemId: '', itemName: '', quantity: 1 }
    ]);
  };

  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ReservationItemDetail, value: string | number) => {
    setSelectedItems(prev =>
      prev.map((item, i) => {
        if (i === index) {
          if (field === 'itemId') {
            const selectedWarehouseItem = warehouseItems.find(w => w.id === value);
            return {
              ...item,
              itemId: String(value),
              itemName: selectedWarehouseItem ? selectedWarehouseItem.name : ''
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Ime i prezime je obavezno';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Lokacija je obavezna';
    }

    if (!formData.dateFrom) {
      newErrors.dateFrom = 'Datum od je obavezan';
    }

    if (!formData.dateTo) {
      newErrors.dateTo = 'Datum do je obavezan';
    }

    if (!formData.time) {
      newErrors.time = 'Vreme je obavezno';
    }

    if (formData.totalPrice <= 0) {
      newErrors.totalPrice = 'Cena mora biti veća od 0';
    }

    if (selectedItems.length === 0) {
      newErrors.items = 'Morate odabrati barem jednu opremu';
    }

    selectedItems.forEach((item, index) => {
      if (!item.itemId) {
        newErrors[`item_${index}_id`] = 'Odaberite opremu';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Količina mora biti veća od 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const reservationData: Omit<ReservationItem, 'id'> = {
      ...formData,
      items: selectedItems.filter(item => item.itemId && item.quantity > 0)
    };

    onSubmit(reservationData);
  };

  function isItemAvailable(itemId: string, dateFrom: string, dateTo: string, reservations: ReservationItem[]) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return !reservations.some(res =>
      res.items.some(i => i.itemId === itemId) &&
      !(to < new Date(res.dateFrom) || from > new Date(res.dateTo))
    );
  }

  const getAvailableItems = (currentItemId?: string) => {
    return warehouseItems.filter(item => {
      const isAlreadySelected = selectedItems.some(
        si => si.itemId === item.id && si.itemId !== currentItemId
      );
      return (
        !isAlreadySelected &&
        item.quantity > 0 &&
        isItemAvailable(item.id, formData.dateFrom, formData.dateTo, sveRezervacije)
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingReservation ? 'Izmeni rezervaciju' : 'Nova rezervacija'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ime i prezime klijenta *
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.clientName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Unesite ime i prezime"
              />
              {errors.clientName && (
                <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokacija isporuke *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.location ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Unesite adresu"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datum od *
              </label>
              <input
                type="date"
                name="dateFrom"
                value={formData.dateFrom}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dateFrom ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dateFrom && (
                <p className="mt-1 text-sm text-red-600">{errors.dateFrom}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datum do *
              </label>
              <input
                type="date"
                name="dateTo"
                value={formData.dateTo}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dateTo ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dateTo && (
                <p className="mt-1 text-sm text-red-600">{errors.dateTo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vreme *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.time ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ukupna cena (RSD) *
              </label>
              <input
                type="number"
                name="totalPrice"
                value={formData.totalPrice}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.totalPrice ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
              />
              {errors.totalPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.totalPrice}</p>
              )}
            </div>
          </div>

          {/* Items Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Oprema za rezervaciju *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Dodaj opremu
              </button>
            </div>

            {errors.items && (
              <p className="mb-4 text-sm text-red-600">{errors.items}</p>
            )}

            <div className="space-y-3">
              {selectedItems.map((item, index) => {
                const availableItems = getAvailableItems(item.itemId);
                const selectedWarehouseItem = warehouseItems.find(w => w.id === item.itemId);

                return (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <select
                        value={item.itemId}
                        onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[`item_${index}_id`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Odaberite opremu</option>
                        {availableItems.map(warehouseItem => (
                          <option key={warehouseItem.id} value={warehouseItem.id}>
                            {warehouseItem.name} (dostupno: {warehouseItem.quantity})
                          </option>
                        ))}
                        {item.itemId && !availableItems.find(ai => ai.id === item.itemId) && selectedWarehouseItem && (
                          <option value={item.itemId}>
                            {selectedWarehouseItem.name} (dostupno: {selectedWarehouseItem.quantity})
                          </option>
                        )}
                      </select>
                      {errors[`item_${index}_id`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_id`]}</p>
                      )}
                    </div>

                    <div className="w-full sm:w-32">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[`item_${index}_quantity`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Količina"
                      />
                      {errors[`item_${index}_quantity`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="w-full sm:w-auto p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {selectedItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nema odabrane opreme. Kliknite "Dodaj opremu" da započnete.</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Napomena
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dodatne informacije o rezervaciji..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingReservation ? 'Sačuvaj izmene' : 'Kreiraj rezervaciju'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Otkaži
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationForm;