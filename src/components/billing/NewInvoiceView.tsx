import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  User, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Receipt, 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  ArrowLeft, 
  Sparkles, 
  Percent, 
  AlertCircle,
  Pill,
  Stethoscope,
  Microscope,
  BedDouble,
  Search
} from 'lucide-react';
import { useBilling } from '../../context/BillingContext';
import { useAppState } from '../../context/AppStateContext';
import { 
  CustomerType, 
  InvoiceCategory, 
  GstRate, 
  InvoiceLineItem, 
  EnhancedInvoice 
} from '../../types/billing';
import { 
  INDIAN_STATES, 
  HEALTHCARE_TAX_CLASSIFICATIONS, 
  validateGstin, 
  isInterStateTransaction, 
  calculateLineGst, 
  calculateInvoiceSummary, 
  formatInr 
} from '../../lib/gstEngine';

interface NewInvoiceViewProps {
  onBack: () => void;
  onSuccess: (invoice: EnhancedInvoice) => void;
}

export const NewInvoiceView: React.FC<NewInvoiceViewProps> = ({ onBack, onSuccess }) => {
  const { taxProfile, createInvoice } = useBilling();
  const { medicines, labTests } = useAppState();

  // Customer Details Form State
  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('b2c_patient');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [gstinError, setGstinError] = useState<string | null>(null);

  // Place of Supply (defaults to clinic's registered state)
  const [posStateCode, setPosStateCode] = useState(taxProfile.stateCode || '33');
  const posState = useMemo(() => {
    return INDIAN_STATES.find(s => s.code === posStateCode)?.name || taxProfile.state;
  }, [posStateCode, taxProfile.state]);

  const isInterState = useMemo(() => {
    return isInterStateTransaction(taxProfile.stateCode || '33', posStateCode);
  }, [taxProfile.stateCode, posStateCode]);

  // Pricing & Round-off settings
  const [priceType, setPriceType] = useState<'exclusive' | 'inclusive'>(taxProfile.defaultPriceType || 'exclusive');
  const [enableRoundOff, setEnableRoundOff] = useState(taxProfile.enableRoundOff ?? true);

  // Line items state
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: `item-${Date.now()}`,
      name: 'OPD Doctor Consultation Fee',
      category: 'opd_consultation',
      hsnSacCode: '999312',
      quantity: 1,
      unit: 'Consultation',
      unitPrice: 500,
      discountAmount: 0,
      taxableAmount: 500,
      gstRate: 0,
      isExempt: true,
      taxTreatment: 'exempt',
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      totalTax: 0,
      totalAmount: 500
    }
  ]);

  // Payment Recording State during invoice creation
  const [collectPaymentNow, setCollectPaymentNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('upi');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recalculate whole invoice summary dynamically
  const invoiceSummary = useMemo(() => {
    return calculateInvoiceSummary(lineItems, enableRoundOff);
  }, [lineItems, enableRoundOff]);

  // Handle GSTIN validation & Auto State Code deduction
  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setCustomerGstin(val);
    if (val.trim().length === 0) {
      setGstinError(null);
      return;
    }
    const res = validateGstin(val);
    if (!res.isValid) {
      setGstinError(res.error || 'Invalid GSTIN');
    } else {
      setGstinError(null);
      if (res.stateCode) {
        setPosStateCode(res.stateCode);
      }
    }
  };

  // Recalculate a line item when its values change
  const updateItem = (index: number, updates: Partial<InvoiceLineItem>) => {
    const current = lineItems[index];
    const merged = { ...current, ...updates };

    const computed = calculateLineGst({
      unitPrice: merged.unitPrice,
      quantity: merged.quantity,
      discountAmount: merged.discountAmount,
      discountPercent: merged.discountPercent,
      gstRate: merged.gstRate,
      isInterState,
      priceType,
      treatment: merged.taxTreatment
    });

    const updatedItem: InvoiceLineItem = {
      ...merged,
      ...computed
    };

    const newItems = [...lineItems];
    newItems[index] = updatedItem;
    setLineItems(newItems);
  };

  const removeItem = (index: number) => {
    if (lineItems.length === 1) {
      alert('Invoice must have at least one line item.');
      return;
    }
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const addItem = (category: InvoiceCategory = 'general_medical') => {
    const defaultClass = HEALTHCARE_TAX_CLASSIFICATIONS.find(c => c.category === category) || HEALTHCARE_TAX_CLASSIFICATIONS[0];
    const computed = calculateLineGst({
      unitPrice: 100,
      quantity: 1,
      discountAmount: 0,
      gstRate: defaultClass.defaultGstRate,
      isInterState,
      priceType,
      treatment: defaultClass.treatment
    });

    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: defaultClass.name,
      category,
      hsnSacCode: defaultClass.code,
      quantity: 1,
      unit: category === 'pharmacy' ? 'Tabs' : 'Nos',
      unitPrice: 100,
      isExempt: defaultClass.treatment === 'exempt',
      taxTreatment: defaultClass.treatment,
      ...computed
    };

    setLineItems([...lineItems, newItem]);
  };

  // Quick Pick: from Pharmacy Medicine
  const handleSelectMedicine = (medId: string) => {
    const med = medicines.find(m => m.id === medId);
    if (!med) return;

    const rate = (med.gstRate === 0 || med.gstRate === 5 || med.gstRate === 12 || med.gstRate === 18 || med.gstRate === 28) ? med.gstRate : 12;
    const computed = calculateLineGst({
      unitPrice: med.sellingPrice,
      quantity: 1,
      discountAmount: 0,
      gstRate: rate as GstRate,
      isInterState,
      priceType,
      treatment: 'taxable'
    });

    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      name: `${med.brandName} (${med.genericName})`,
      category: 'pharmacy',
      hsnSacCode: med.hsn || '3004',
      quantity: 1,
      unit: 'Tabs',
      unitPrice: med.sellingPrice,
      isExempt: false,
      taxTreatment: 'taxable',
      batchNo: med.batchNo,
      expiryDate: med.expiryDate,
      medicineId: med.id,
      ...computed
    };

    setLineItems([...lineItems, newItem]);
  };

  // Save / Finalize Invoice Handler
  const handleSaveInvoice = async (asDraft: boolean = false) => {
    if (!customerName.trim()) {
      alert('Please enter patient or customer name.');
      return;
    }

    if (lineItems.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedAmountPaid = collectPaymentNow
        ? (amountPaidInput ? parseFloat(amountPaidInput) : invoiceSummary.grandTotal)
        : 0;

      const initialPayments = parsedAmountPaid > 0 ? [
        {
          id: `PAY-${Date.now()}`,
          invoiceId: '',
          amount: parsedAmountPaid,
          paymentMethod,
          transactionRef: transactionRef || `TXN-${Date.now()}`,
          paymentDate: new Date().toISOString(),
          notes: 'Received at invoice creation'
        }
      ] : [];

      const created = await createInvoice({
        customerDetails: {
          name: customerName.trim(),
          type: customerType,
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          address: customerAddress.trim(),
          state: posState,
          stateCode: posStateCode,
          gstin: customerGstin.trim() || undefined
        },
        placeOfSupply: `${posState} (${posStateCode})`,
        placeOfSupplyCode: posStateCode,
        isInterState,
        priceType,
        items: lineItems,
        invoiceStatus: asDraft ? 'draft' : 'issued',
        amountPaid: parsedAmountPaid,
        payments: initialPayments,
        notes: notes.trim() || undefined
      });

      onSuccess(created);
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Series: <strong className="text-slate-800">{taxProfile.invoicePrefix}/{taxProfile.financialYear}</strong>
          </span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>GST Tax Invoice Engine</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Details & Line Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer / Patient Information Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                <span>Customer / Patient Information</span>
              </h3>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400">Type:</span>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                  className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 text-xs focus:outline-none"
                >
                  <option value="b2c_patient">B2C Patient / Walk-in</option>
                  <option value="b2b_corporate">B2B Registered Enterprise</option>
                  <option value="hospital">Hospital / Polyclinic</option>
                  <option value="pharmacy">Chemist / Medical Shop</option>
                  <option value="laboratory">Diagnostic Laboratory</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer / Patient Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar / Apollo Medcare Pvt Ltd"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GSTIN {customerType === 'b2b_corporate' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  placeholder="33AAAAA0000A1Z5"
                  value={customerGstin}
                  onChange={handleGstinChange}
                  className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase ${
                    gstinError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                  }`}
                />
                {gstinError && <p className="text-[10px] text-rose-500 mt-1">{gstinError}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Place of Supply (State)
                </label>
                <select
                  value={posStateCode}
                  onChange={(e) => setPosStateCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium bg-white"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tax Classification
                </label>
                <div className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center justify-between ${
                  isInterState ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}>
                  <span>{isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick-Pick Items Toolbar */}
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Quick Pick Services:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => addItem('opd_consultation')}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-teal-800 border border-slate-200 rounded-xl font-bold transition-colors"
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span>+ Consultation (0%)</span>
              </button>

              <button
                type="button"
                onClick={() => addItem('lab_test')}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-800 border border-slate-200 rounded-xl font-bold transition-colors"
              >
                <Microscope className="w-3.5 h-3.5 text-indigo-600" />
                <span>+ Lab Test (0%)</span>
              </button>

              <button
                type="button"
                onClick={() => addItem('pharmacy')}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-amber-800 border border-slate-200 rounded-xl font-bold transition-colors"
              >
                <Pill className="w-3.5 h-3.5 text-amber-600" />
                <span>+ Medicine (12%)</span>
              </button>

              <button
                type="button"
                onClick={() => addItem('room_rent')}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-800 border border-slate-200 rounded-xl font-bold transition-colors"
              >
                <BedDouble className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Bed Rent</span>
              </button>

              {/* Medicine Inventory Quick Dropdown */}
              {medicines.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSelectMedicine(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-2 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="">+ Pick from Pharmacy Stock...</option>
                  {medicines.slice(0, 15).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.brandName} - ₹{m.sellingPrice} (Stock: {m.stock})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-600" />
                <span>Invoice Line Items & GST Calculations ({lineItems.length})</span>
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1 cursor-pointer font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={priceType === 'inclusive'}
                    onChange={(e) => setPriceType(e.target.checked ? 'inclusive' : 'exclusive')}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>GST Inclusive Price</span>
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-3">Item / Service Details</th>
                    <th className="py-3 px-2 w-20">HSN/SAC</th>
                    <th className="py-3 px-2 w-16 text-center">Qty</th>
                    <th className="py-3 px-2 w-24 text-right">Price (₹)</th>
                    <th className="py-3 px-2 w-20 text-right">Disc (₹)</th>
                    <th className="py-3 px-2 w-20">GST %</th>
                    <th className="py-3 px-2 text-right">Tax (₹)</th>
                    <th className="py-3 px-3 text-right">Total (₹)</th>
                    <th className="py-3 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(idx, { name: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold text-slate-900"
                          placeholder="Item or consultation name"
                        />
                        {item.batchNo && (
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            Batch: {item.batchNo} | Exp: {item.expiryDate}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={item.hsnSacCode}
                          onChange={(e) => updateItem(idx, { hsnSacCode: e.target.value })}
                          className="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded-lg focus:outline-none text-center"
                        />
                      </td>

                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                          className="w-14 px-1 py-1 text-xs text-center border border-slate-200 rounded-lg focus:outline-none font-bold"
                        />
                      </td>

                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                          className="w-20 px-1.5 py-1 text-xs text-right border border-slate-200 rounded-lg focus:outline-none font-medium"
                        />
                      </td>

                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discountAmount}
                          onChange={(e) => updateItem(idx, { discountAmount: Number(e.target.value) })}
                          className="w-16 px-1 py-1 text-xs text-right border border-slate-200 rounded-lg focus:outline-none text-slate-600"
                        />
                      </td>

                      <td className="py-3 px-2">
                        <select
                          value={item.gstRate}
                          onChange={(e) => {
                            const newRate = Number(e.target.value) as GstRate;
                            updateItem(idx, {
                              gstRate: newRate,
                              isExempt: newRate === 0,
                              taxTreatment: newRate === 0 ? 'exempt' : 'taxable'
                            });
                          }}
                          className="w-full px-1 py-1 text-[11px] font-bold border border-slate-200 rounded-lg focus:outline-none bg-white"
                        >
                          <option value="0">0% (Exempt)</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>

                      <td className="py-3 px-2 text-right font-mono text-slate-600">
                        ₹{item.totalTax.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        ₹{item.totalAmount.toFixed(2)}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove Line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => addItem('general_medical')}
                className="inline-flex items-center gap-1 font-bold text-teal-700 hover:text-teal-900 px-3 py-1 rounded-lg hover:bg-teal-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Line Item</span>
              </button>

              <span className="text-slate-400">
                {priceType === 'inclusive' ? 'Prices inclusive of taxes' : 'GST calculated exclusive on taxable base'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Payment Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Invoice Summary Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Financial Totals</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                {isInterState ? 'IGST Applicable' : 'CGST + SGST'}
              </span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal (Gross):</span>
                <span className="font-semibold text-slate-900">{formatInr(invoiceSummary.subTotal)}</span>
              </div>

              {invoiceSummary.totalDiscount > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold bg-amber-50 px-2 py-1 rounded-lg">
                  <span>Line Discounts:</span>
                  <span>- {formatInr(invoiceSummary.totalDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100">
                <span>Net Taxable Base:</span>
                <span>{formatInr(invoiceSummary.totalTaxable)}</span>
              </div>

              {!isInterState ? (
                <>
                  <div className="flex justify-between text-[11px] text-slate-500 pl-2">
                    <span>Central GST (CGST):</span>
                    <span>{formatInr(invoiceSummary.totalCgst)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pl-2">
                    <span>State GST (SGST):</span>
                    <span>{formatInr(invoiceSummary.totalSgst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-[11px] text-indigo-700 font-semibold pl-2">
                  <span>Integrated GST (IGST):</span>
                  <span>{formatInr(invoiceSummary.totalIgst)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-slate-700 font-bold">
                <span>Total Output GST:</span>
                <span>{formatInr(invoiceSummary.totalTax)}</span>
              </div>

              {invoiceSummary.roundOff !== 0 && (
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Round-off Adjustment:</span>
                  <span>{invoiceSummary.roundOff > 0 ? `+₹${invoiceSummary.roundOff}` : `-₹${Math.abs(invoiceSummary.roundOff)}`}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-black text-slate-900 text-sm">Invoice Grand Total:</span>
                <span className="text-2xl font-black text-teal-700">
                  {formatInr(invoiceSummary.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Collection Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={collectPaymentNow}
                  onChange={(e) => setCollectPaymentNow(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Record Payment Now</span>
              </label>
              {collectPaymentNow && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Instant Settlement
                </span>
              )}
            </div>

            {collectPaymentNow && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'upi', label: 'UPI / QR', icon: <QrCode className="w-3.5 h-3.5" /> },
                      { id: 'cash', label: 'Cash Counter', icon: <Receipt className="w-3.5 h-3.5" /> },
                      { id: 'card', label: 'Debit/Credit Card', icon: <CreditCard className="w-3.5 h-3.5" /> },
                      { id: 'bank_transfer', label: 'Bank Transfer', icon: <Building2 className="w-3.5 h-3.5" /> }
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2 rounded-xl border flex items-center gap-1.5 font-bold transition-all ${
                          paymentMethod === m.id
                            ? 'bg-teal-50 border-teal-500 text-teal-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`Full amount: ₹${invoiceSummary.grandTotal}`}
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave empty to mark fully paid (₹{invoiceSummary.grandTotal})</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Transaction / Reference ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/260410/009182"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveInvoice(false)}
              className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Finalizing Invoice...' : 'Finalize & Issue GST Invoice'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveInvoice(true)}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors"
            >
              Save as Draft Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
