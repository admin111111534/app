import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { WarehouseItem } from '../types';

interface WarehouseFormProps {
  onSubmit: (item: Omit<WarehouseItem, 'id'>) => void;
  onCancel: () => void;
  editingItem?: WarehouseItem | null;
  existingItems: WarehouseItem[];
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({
  onSubmit,
  onCancel,
  editingItem,
  existingItems
}) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    category: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Predefined categories with option to add custom
  const predefinedCategories = ['Stolice', 'Stolovi', 'Šatori', 'Pagode', 'Ostalo'];
  const existingCategories = [...new Set(existingItems.map(item => item.category))];
  const allCategories = [...new Set([...predefinedCategories, ...existingCategories])];

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        quantity: editingItem.quantity,
        category: editingItem.category
      });
    }
  }, [editingItem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Naziv artikla je obavezan';
    } else {
      // Check if name already exists (except when editing the same item)
      const existingItem = existingItems.find(item => 
        item.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        (!editingItem || item.id !== editingItem.id)
      );
      if (existingItem) {
        newErrors.name = 'Artikal sa ovim nazivom već postoji';
      }
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Kategorija je obavezna';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Količina ne može biti negativna';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      quantity: formData.quantity,
      category: formData.category.trim()
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingItem ? 'Izmeni artikal' : 'Novi artikal'}
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
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Naziv artikla *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Unesite naziv artikla"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategorija *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.category ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Odaberite kategoriju</option>
              {allCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
            
            {/* Custom category input */}
            <div className="mt-2">
              <input
                type="text"
                placeholder="Ili unesite novu kategoriju"
                value={!allCategories.includes(formData.category) ? formData.category : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Početna količina
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.quantity ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0"
              min="0"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Kasnije možete lako podešavati količinu kroz brzu izmenu
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingItem ? 'Sačuvaj izmene' : 'Dodaj artikal'}
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

export default WarehouseForm;