import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldCheck,
  CreditCard,
  Clock,
  Edit2,
  User
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { SupplierMaster as SupplierType, SupplierStatus } from '../../types/procurement';
import { v4 as uuidv4 } from 'uuid';
import confetti from 'canvas-confetti';

export const SupplierMaster = () => {
  const { suppliers, addSupplier, updateSupplier, toggleSupplierStatus } = useProcurement();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierType | null>(null);

  // New Supplier Form
  const [formData, setFormData] = useState<Partial<SupplierType>>({
    legalName: '',
    tradeName: '',
    category: 'Pharmaceuticals & Generics',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    state: 'Tamil Nadu',
    stateCode: '33',
    billingAddress: '',
    shippingAddress: '',
    paymentTermsDays: 30,
    creditLimit: 250000,
    leadTimeDays: 3,
    minimumOrderValue: 5000,
    rating: 4.5,
    drugLicenseNumber: '',
    status: 'Active',
    bankDetails: {
      bankName: 'HDFC Bank',
      accountNumberMasked: '•••• •••• 1234',
      ifscCode: 'HDFC0001234',
      accountHolderName: ''
    }
  });

  const categories = ['All', 'Pharmaceuticals & Generics', 'Diagnostic Reagents & Kits', 'Hospital Consumables & Antibiotics', 'Laboratory Instruments & Calibrators', 'Medical Devices & Equipment'];

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      if (categoryFilter !== 'All' && s.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.legalName.toLowerCase().includes(q) ||
          s.supplierCode.toLowerCase().includes(q) ||
          s.gstin.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [suppliers, categoryFilter, statusFilter, searchQuery]);

  const handleAddSupplier = () => {
    if (!formData.legalName || !formData.gstin || !formData.phone) {
      alert('Please fill at least Legal Name, GSTIN, and Phone number.');
      return;
    }

    const nextCode = `VEN-${formData.stateCode || '33'}-${String(suppliers.length + 1).padStart(3, '0')}`;
    const newSupplier: SupplierType = {
      id: `supp-${uuidv4().substring(0, 8)}`,
      organizationId: 'org-default',
      supplierCode: nextCode,
      legalName: formData.legalName,
      tradeName: formData.tradeName || formData.legalName,
      category: formData.category || 'Pharmaceuticals & Generics',
      contactPerson: formData.contactPerson || 'Proprietor',
      email: formData.email || '',
      phone: formData.phone || '',
      gstin: formData.gstin.toUpperCase(),
      pan: formData.pan || formData.gstin.substring(2, 12).toUpperCase(),
      state: formData.state || 'Tamil Nadu',
      stateCode: formData.stateCode || '33',
      billingAddress: formData.billingAddress || 'Tamil Nadu, India',
      shippingAddress: formData.shippingAddress || formData.billingAddress || 'Tamil Nadu, India',
      paymentTermsDays: Number(formData.paymentTermsDays) || 30,
      creditLimit: Number(formData.creditLimit) || 100000,
      bankDetails: formData.bankDetails || {
        bankName: 'Nationalized Bank',
        accountNumberMasked: '•••• •••• 0000',
        ifscCode: 'UTIB0000000',
        accountHolderName: formData.legalName
      },
      productCategories: [formData.category || 'Pharmaceuticals'],
      leadTimeDays: Number(formData.leadTimeDays) || 3,
      minimumOrderValue: Number(formData.minimumOrderValue) || 5000,
      rating: Number(formData.rating) || 4.5,
      drugLicenseNumber: formData.drugLicenseNumber,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addSupplier(newSupplier);
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">Supplier &amp; Vendor Master Directory</h2>
          <p className="text-xs text-slate-500">Manage registered healthcare suppliers, GST compliance, credit terms, and bank profiles.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Onboard New Supplier</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search vendor legal name, GSTIN, code, contact..."
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 outline-none bg-slate-50 font-medium max-w-[200px] truncate"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 outline-none bg-slate-50 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSuppliers.map(supplier => (
          <div
            key={supplier.id}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
              supplier.status === 'Active' ? 'border-slate-200 hover:border-teal-300' : 'border-red-200 bg-red-50/20'
            }`}
          >
            <div>
              {/* Header card */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                  {supplier.supplierCode}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  supplier.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {supplier.status}
                </span>
              </div>

              <h3 className="font-bold text-navy-900 text-sm">{supplier.legalName}</h3>
              <p className="text-xs text-teal-700 font-medium">{supplier.category}</p>

              {/* Contact info */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>{supplier.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{supplier.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{supplier.state} (Code: {supplier.stateCode})</span>
                </div>
              </div>

              {/* Tax & Terms Pill */}
              <div className="mt-3 p-2 bg-slate-50 rounded-xl text-[11px] text-slate-700 space-y-0.5 font-mono">
                <div>GSTIN: <strong>{supplier.gstin}</strong></div>
                <div>PAN: <strong>{supplier.pan}</strong></div>
              </div>
            </div>

            {/* Footer card */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <span>{supplier.rating}</span>
                <span className="text-[10px] text-slate-400 font-normal ml-1">({supplier.leadTimeDays}d lead)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSupplierStatus(supplier.id)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                    supplier.status === 'Active'
                      ? 'text-red-600 border-red-200 hover:bg-red-50'
                      : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {supplier.status === 'Active' ? 'Block' : 'Activate'}
                </button>
                <button
                  onClick={() => setSelectedSupplier(supplier)}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
                >
                  Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ONBOARD NEW SUPPLIER MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Onboard Healthcare Vendor</h3>
                <p className="text-xs text-slate-500">Register verified supplier master data for procurement and invoicing.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Supplier Legal Name *</label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={e => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="e.g. Apollo MedSolutions Pvt Ltd"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">GSTIN (15 Digits) *</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="33AAACA1234A1Z5"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">PAN Number *</label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    placeholder="AAACA1234A"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">State &amp; State Code</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Tamil Nadu (33)"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Sales Manager"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9840123456"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Official Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="orders@supplier.com"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Drug License (DL No)</label>
                  <input
                    type="text"
                    value={formData.drugLicenseNumber}
                    onChange={e => setFormData({ ...formData, drugLicenseNumber: e.target.value })}
                    placeholder="TN-20B-112233"
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Payment Credit (Days)</label>
                  <input
                    type="number"
                    value={formData.paymentTermsDays}
                    onChange={e => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) || 30 })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={formData.leadTimeDays}
                    onChange={e => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 3 })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={e => setFormData({ ...formData, creditLimit: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Registered Billing Address</label>
                <textarea
                  rows={2}
                  value={formData.billingAddress}
                  onChange={e => setFormData({ ...formData, billingAddress: e.target.value })}
                  placeholder="Complete street, area, city, pin code..."
                  className="w-full p-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSupplier}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Save Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUPPLIER PROFILE MODAL ── */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-navy-900">{selectedSupplier.legalName}</h3>
                <p className="text-xs text-slate-500">Supplier Code: {selectedSupplier.supplierCode}</p>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="text-slate-400 font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div><span className="text-slate-500">Category:</span> <strong>{selectedSupplier.category}</strong></div>
                <div><span className="text-slate-500">GSTIN:</span> <strong className="font-mono">{selectedSupplier.gstin}</strong></div>
                <div><span className="text-slate-500">PAN:</span> <strong className="font-mono">{selectedSupplier.pan}</strong></div>
                <div><span className="text-slate-500">Drug License:</span> <strong>{selectedSupplier.drugLicenseNumber || 'N/A'}</strong></div>
              </div>

              <div className="p-3 bg-teal-50/50 rounded-xl space-y-1">
                <div><span className="text-slate-500">Payment Terms:</span> <strong>Net {selectedSupplier.paymentTermsDays} Days</strong></div>
                <div><span className="text-slate-500">Delivery Lead Time:</span> <strong>{selectedSupplier.leadTimeDays} Business Days</strong></div>
                <div><span className="text-slate-500">Bank Details:</span> <strong>{selectedSupplier.bankDetails.bankName} ({selectedSupplier.bankDetails.accountNumberMasked})</strong></div>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Billing Address:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedSupplier.billingAddress}</p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
