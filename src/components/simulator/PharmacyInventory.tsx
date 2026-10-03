import React, { useState } from 'react';
import { Package, AlertTriangle, PlusCircle } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { Medicine } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const PharmacyInventory = () => {
  const { medicines, restockMedicine, addMedicine } = useAppState();
  const [filter, setFilter] = useState('All');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState<Partial<Medicine>>({
    genericName: '', brandName: '', batchNo: '', hsn: '3004', costPrice: 0, sellingPrice: 0, gstRate: 12, stock: 0, expiryDate: '', category: 'General'
  });

  const categories = ['All', ...Array.from(new Set(medicines.map(m => m.category)))];

  const filteredMedicines = filter === 'All' ? medicines : medicines.filter(m => m.category === filter);

  const getExpiryStatus = (dateStr: string) => {
    const exp = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(exp.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (exp < now) return { color: 'text-red-600 bg-red-50', label: 'Expired' };
    if (diffDays < 90) return { color: 'text-amber-600 bg-amber-50', label: 'Near Expiry' };
    return { color: 'text-emerald-600 bg-emerald-50', label: 'Good' };
  };

  const handleAddMedicine = () => {
    if (!newMed.brandName || !newMed.expiryDate) return;
    
    addMedicine({
      id: `med-${uuidv4().substring(0, 8)}`,
      ...newMed
    } as Medicine);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === cat ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shrink-0 shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Medicine & Batch</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price (SP)</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-center">FEFO Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.map(med => {
                const status = getExpiryStatus(med.expiryDate);
                const isLowStock = med.stock < 50;
                
                return (
                  <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-navy-900">{med.brandName}</div>
                      <div className="text-xs text-slate-500">{med.genericName} | Batch: {med.batchNo}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{med.category}</td>
                    <td className="px-6 py-4 font-medium text-teal-700">₹{med.sellingPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center space-x-1 font-semibold ${isLowStock ? 'text-red-600' : 'text-navy-900'}`}>
                        {isLowStock && <AlertTriangle className="h-4 w-4" />}
                        <span>{med.stock}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.label} ({new Date(med.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => restockMedicine(med.id, 100)}
                        className="text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded transition-colors"
                      >
                        +100 Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-navy-900">Add New Medicine</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Brand Name *</label>
                  <input type="text" onChange={e => setNewMed({...newMed, brandName: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Generic Name</label>
                  <input type="text" onChange={e => setNewMed({...newMed, genericName: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Batch No</label>
                  <input type="text" onChange={e => setNewMed({...newMed, batchNo: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                  <input type="text" onChange={e => setNewMed({...newMed, category: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md text-sm" placeholder="e.g. Analgesics" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">HSN</label>
                  <input type="text" onChange={e => setNewMed({...newMed, hsn: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Cost Price (₹)</label>
                  <input type="number" onChange={e => setNewMed({...newMed, costPrice: parseFloat(e.target.value)})} className="w-full p-2 border border-slate-200 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Selling Price (₹)</label>
                  <input type="number" onChange={e => setNewMed({...newMed, sellingPrice: parseFloat(e.target.value)})} className="w-full p-2 border border-slate-200 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">GST Rate (%)</label>
                  <select onChange={e => setNewMed({...newMed, gstRate: parseInt(e.target.value)})} className="w-full p-2 border border-slate-200 rounded-md text-sm">
                    <option value="12">12%</option><option value="5">5%</option><option value="18">18%</option><option value="0">0%</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Initial Stock</label>
                  <input type="number" onChange={e => setNewMed({...newMed, stock: parseInt(e.target.value)})} className="w-full p-2 border border-slate-200 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Expiry Date *</label>
                  <input type="date" onChange={e => setNewMed({...newMed, expiryDate: e.target.value})} className="w-full p-2 border border-slate-200 rounded-md text-sm" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={handleAddMedicine} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Save Medicine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
