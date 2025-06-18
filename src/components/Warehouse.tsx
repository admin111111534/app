import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { WarehouseItem, ReservationItem } from '../types';
import WarehouseForm from './WarehouseForm';

interface WarehouseProps {
  warehouseItems: WarehouseItem[];
  reservations?: ReservationItem[]; // Dozvoljavamo da bude undefined radi zaštite
  addWarehouseItem: (item: Omit<WarehouseItem, 'id'>) => Promise<void>;
  updateWarehouseItem: (id: string, data: Partial<WarehouseItem>) => Promise<void>;
  deleteWarehouseItem: (id: string) => Promise<void>;
}

const getCurrentReservationEndDate = (itemId: string, reservations?: ReservationItem[]) => {
  if (!reservations || !Array.isArray(reservations)) return null;
  const today = new Date();
  const activeReservations = reservations.filter(res =>
    res.items.some(i => i.itemId === itemId) &&
    new Date(res.dateFrom) <= today &&
    new Date(res.dateTo) >= today
  );
  if (activeReservations.length === 0) return null;
  const endDates = activeReservations.map(res => res.dateTo);
  return endDates.sort()[0];
};

const getReservationsForItem = (itemId: string, reservations: ReservationItem[]) => {
  return reservations
    .filter(res =>
      res.items.some(i => i.itemId === itemId) &&
      res.status !== 'finished'
    )
    .map(res => ({
      dateFrom: res.dateFrom,
      dateTo: res.dateTo
    }));
};

const Warehouse: React.FC<WarehouseProps> = ({
  warehouseItems,
  reservations = [],
  addWarehouseItem,
  updateWarehouseItem,
  deleteWarehouseItem
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WarehouseItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [...new Set(warehouseItems.map(item => item.category))];

  const filteredItems = warehouseItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddOrUpdateItem = async (itemData: Omit<WarehouseItem, 'id'>) => {
    if (editingItem) {
      await updateWarehouseItem(editingItem.id, itemData);
    } else {
      await addWarehouseItem(itemData);
    }
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (item: WarehouseItem) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovaj artikal?')) {
      await deleteWarehouseItem(item.id);
    }
  };

  const handleEditItem = (item: WarehouseItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleQuantityAdjustment = async (item: WarehouseItem, adjustment: number) => {
    const newQuantity = item.quantity + adjustment;
    if (newQuantity < 0) return;
    await updateWarehouseItem(item.id, { quantity: newQuantity });
  };

  if (showForm) {
    return (
      <WarehouseForm
        onSubmit={handleAddOrUpdateItem}
        onCancel={handleCancelForm}
        editingItem={editingItem}
        existingItems={warehouseItems}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Magacin</h1>
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj novi artikal
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ukupno artikala</p>
              <p className="text-2xl font-bold text-gray-900">{warehouseItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ukupne zalihe</p>
              <p className="text-2xl font-bold text-gray-900">
                {warehouseItems.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Malo zaliha</p>
              <p className="text-2xl font-bold text-gray-900">
                {warehouseItems.filter(item => item.quantity < 10).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Pretraži artikle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sve kategorije</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nema artikala</h3>
            <p className="text-gray-500 mb-6">Dodajte prvi artikal u magacin!</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Dodaj novi artikal
            </button>
          </div>
        ) : (
          filteredItems.map(item => {
            return (
              <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Izmeni artikal"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Obriši artikal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900">
                      {item.quantity} kom
                    </span>
                    {item.quantity < 10 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Malo zaliha
                      </span>
                    )}
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.quantity < 10 ? 'bg-red-500' : 
                        item.quantity < 25 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min((item.quantity / 100) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Brza promena:</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleQuantityAdjustment(item, -1)}
                      disabled={item.quantity === 0}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleQuantityAdjustment(item, -5)}
                      disabled={item.quantity < 5}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleQuantityAdjustment(item, 1)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleQuantityAdjustment(item, 5)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      +5
                    </button>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Rezervacije:</span>
                    <span className="font-medium text-gray-900">
                      {
                        (() => {
                          const itemReservations = getReservationsForItem(item.id, reservations);
                          if (itemReservations.length === 0) return 'Slobodan';
                          return itemReservations.map((res, index) => (
                            <div key={index}>
                              {`Od ${new Date(res.dateFrom).toLocaleDateString('sr-RS')} do ${new Date(res.dateTo).toLocaleDateString('sr-RS')}`}
                            </div>
                          ));
                        })()
                      }
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Warehouse;