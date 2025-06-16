import React, { useState } from "react";
import { WarehouseItem } from "../types";

interface DodajArtikalProps {
  addWarehouseItem: (item: Omit<WarehouseItem, 'id'>) => Promise<void>;
}

const DodajArtikal: React.FC<DodajArtikalProps> = ({ addWarehouseItem }) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [category, setCategory] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim()) return;
    await addWarehouseItem({ name: name.trim(), quantity: Number(quantity), category: category.trim() });
    setName("");
    setQuantity(0);
    setCategory("");
    alert("Artikal dodat!");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-sm mt-6">
      <input
        type="text"
        placeholder="Naziv artikla"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        className="border rounded px-3 py-2"
      />
      <input
        type="number"
        placeholder="Količina"
        value={quantity}
        onChange={e => setQuantity(Number(e.target.value))}
        required
        min={0}
        className="border rounded px-3 py-2"
      />
      <input
        type="text"
        placeholder="Kategorija"
        value={category}
        onChange={e => setCategory(e.target.value)}
        required
        className="border rounded px-3 py-2"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition-colors"
      >
        Dodaj artikal
      </button>
    </form>
  );
};

export default DodajArtikal;