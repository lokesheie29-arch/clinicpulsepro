import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Filter, 
  Search, 
  IndianRupee, 
  Building, 
  Truck, 
  ShieldCheck,
  TrendingUp,
  FileText,
  Percent
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';

export const ProcurementReports: React.FC = () => {
  const { purchaseOrders, suppliers, supplierInvoices, grns } = useProcurement();

  const [reportType, setReportType] = useState<'purchase_register' | 'supplier_spend' | 'gst_itc' | 'item_consumption'>('purchase_register');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_30_days' | 'fy'>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Flattened line items for purchase register
  const lineItems = useMemo(() => {
    const list: any[] = [];
    purchaseOrders.forEach((po) => {
      if (selectedBranch !== 'all' && po.branch !== selectedBranch) return;

      po.items.forEach((item) => {
        const unitPrice = item.quotedUnitPrice ?? item.estimatedUnitPrice ?? 0;
        const discount = item.discountPercent ?? 0;
        const qty = item.requestedQty ?? 1;
        const taxable = item.taxableAmount ?? (qty * unitPrice * (1 - discount / 100));
        const gstAmount = (item.cgstAmount ?? 0) + (item.sgstAmount ?? 0) || (taxable * (item.gstRate / 100));
        const cgst = item.cgstAmount ?? (gstAmount / 2);
        const sgst = item.sgstAmount ?? (gstAmount / 2);

        list.push({
          poNumber: po.poNumber,
          poDate: po.poDate,
          supplierName: po.supplierName,
          branchName: po.branch,
          department: po.department,
          status: po.status,
          itemCode: item.itemCode || item.id,
          itemName: item.itemName,
          category: item.category,
          hsnCode: item.hsnCode || '3004',
          quantity: qty,
          uom: item.uom,
          unitPrice: unitPrice,
          discount: discount,
          taxableValue: taxable,
          gstRate: item.gstRate,
          cgst,
          sgst,
          totalAmount: taxable + gstAmount,
        });
      });
    });
    return list;
  }, [purchaseOrders, selectedBranch]);

  // Supplier spend grouping
  const supplierSpendData = useMemo(() => {
    const map = new Map<string, {
      name: string;
      category: string;
      rating: number;
      poCount: number;
      totalSpend: number;
      lastOrderDate: string;
    }>();

    purchaseOrders.forEach(po => {
      if (selectedBranch !== 'all' && po.branch !== selectedBranch) return;
      const current = map.get(po.supplierId) || {
        name: po.supplierName,
        category: 'Medical Supplies',
        rating: 4.8,
        poCount: 0,
        totalSpend: 0,
        lastOrderDate: po.poDate
      };
      current.poCount += 1;
      current.totalSpend += po.totalAmount;
      if (po.poDate > current.lastOrderDate) {
        current.lastOrderDate = po.poDate;
      }
      map.set(po.supplierId, current);
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [purchaseOrders, selectedBranch]);

  // GST ITC data summary
  const gstSummary = useMemo(() => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;

    lineItems.forEach(line => {
      totalTaxable += line.taxableValue;
      totalCgst += line.cgst;
      totalSgst += line.sgst;
      totalGst += (line.cgst + line.sgst);
    });

    return {
      totalTaxable,
      totalCgst,
      totalSgst,
      totalGst,
      totalGross: totalTaxable + totalGst
    };
  }, [lineItems]);

  // Export to Excel CSV
  const handleExportCsv = () => {
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let headers: string[] = [];
    let rows: string[] = [];
    let filename = '';

    if (reportType === 'purchase_register') {
      filename = `ClinicPulse_Purchase_Register_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'PO Number',
        'Date',
        'Supplier Name',
        'Branch',
        'Department',
        'Status',
        'Item Code',
        'Item Name',
        'Category',
        'HSN Code',
        'Quantity',
        'UOM',
        'Unit Price (INR)',
        'Discount %',
        'Taxable Value (INR)',
        'GST Rate %',
        'CGST (INR)',
        'SGST (INR)',
        'Total Amount (INR)'
      ];

      rows = lineItems.map(item => [
        escapeCsv(item.poNumber),
        escapeCsv(item.poDate),
        escapeCsv(item.supplierName),
        escapeCsv(item.branchName),
        escapeCsv(item.department),
        escapeCsv(item.status),
        escapeCsv(item.itemCode),
        escapeCsv(item.itemName),
        escapeCsv(item.category),
        escapeCsv(item.hsnCode),
        item.quantity,
        escapeCsv(item.uom),
        item.unitPrice.toFixed(2),
        item.discount,
        item.taxableValue.toFixed(2),
        item.gstRate,
        item.cgst.toFixed(2),
        item.sgst.toFixed(2),
        item.totalAmount.toFixed(2)
      ].join(','));
    } else if (reportType === 'supplier_spend') {
      filename = `ClinicPulse_Supplier_Spend_Analysis_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Supplier Legal Name', 'Category', 'Rating', 'Total POs Raised', 'Total Value (INR)', 'Last Order Date'];
      rows = supplierSpendData.map(s => [
        escapeCsv(s.name),
        escapeCsv(s.category),
        s.rating,
        s.poCount,
        s.totalSpend.toFixed(2),
        escapeCsv(s.lastOrderDate)
      ].join(','));
    } else if (reportType === 'gst_itc') {
      filename = `ClinicPulse_GST_ITC_Register_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['PO Number', 'Date', 'Supplier', 'HSN/SAC', 'Taxable Value (INR)', 'GST Rate %', 'CGST (INR)', 'SGST (INR)', 'Total Tax (INR)'];
      rows = lineItems.map(item => [
        escapeCsv(item.poNumber),
        escapeCsv(item.poDate),
        escapeCsv(item.supplierName),
        escapeCsv(item.hsnCode),
        item.taxableValue.toFixed(2),
        item.gstRate,
        item.cgst.toFixed(2),
        item.sgst.toFixed(2),
        (item.cgst + item.sgst).toFixed(2)
      ].join(','));
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Procurement & Financial Registers</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit-ready purchase registers, vendor spend intelligence, and GST Input Tax Credit (ITC) ledgers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export to Excel (.CSV)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Taxable Value</div>
          <div className="text-xl font-extrabold text-slate-900 mt-2 flex items-center">
            <IndianRupee className="w-4 h-4" />
            {gstSummary.totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Excluding GST charges</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total CGST Claimable</div>
          <div className="text-xl font-extrabold text-indigo-600 mt-2 flex items-center">
            <IndianRupee className="w-4 h-4" />
            {gstSummary.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Central GST Credit (ITC)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total SGST Claimable</div>
          <div className="text-xl font-extrabold text-purple-600 mt-2 flex items-center">
            <IndianRupee className="w-4 h-4" />
            {gstSummary.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">State GST Credit (ITC)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Purchase Incurred</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-2 flex items-center">
            <IndianRupee className="w-4 h-4" />
            {gstSummary.totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">All-inclusive expenditure</div>
        </div>
      </div>

      {/* Report Selection & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setReportType('purchase_register')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                reportType === 'purchase_register' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Purchase Register (Line-Level)
            </button>
            <button
              onClick={() => setReportType('supplier_spend')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                reportType === 'supplier_spend' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Supplier Spend Summary
            </button>
            <button
              onClick={() => setReportType('gst_itc')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                reportType === 'gst_itc' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GST / Input Tax Credit
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Branches</option>
              <option value="Main Campus - Central">Main Campus - Central</option>
              <option value="South Wing Medical Centre">South Wing Medical Centre</option>
              <option value="North City PolyClinic">North City PolyClinic</option>
            </select>

            <div className="relative w-48">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search register..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Tabular View */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          {reportType === 'purchase_register' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">PO Ref</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-3">Item Description</th>
                  <th className="py-3 px-2">HSN</th>
                  <th className="py-3 px-2 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Rate (INR)</th>
                  <th className="py-3 px-3 text-right">Taxable</th>
                  <th className="py-3 px-2 text-center">GST%</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems
                  .filter(i => 
                    i.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    i.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    i.itemName.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{row.poNumber}</td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{row.poDate}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{row.supplierName}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{row.itemName}</div>
                        <div className="text-[10px] text-slate-400">{row.category}</div>
                      </td>
                      <td className="py-3 px-2 font-mono text-[11px] text-slate-600">{row.hsnCode}</td>
                      <td className="py-3 px-2 text-right font-medium">{row.quantity} {row.uom}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{row.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium">₹{row.taxableValue.toFixed(2)}</td>
                      <td className="py-3 px-2 text-center font-bold text-indigo-700">{row.gstRate}%</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{row.totalAmount.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {reportType === 'supplier_spend' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Supplier Legal Entity</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Quality Rating</th>
                  <th className="py-3 px-3 text-center">Total POs</th>
                  <th className="py-3 px-3 text-right">Cumulative Value</th>
                  <th className="py-3 px-4">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierSpendData.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-3 text-slate-600">{s.category}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        ★ {s.rating}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-medium">{s.poCount}</td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-700 font-mono">
                      ₹{s.totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{s.lastOrderDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'gst_itc' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">PO Ref</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-2">HSN</th>
                  <th className="py-3 px-3 text-right">Taxable Value</th>
                  <th className="py-3 px-2 text-center">GST%</th>
                  <th className="py-3 px-3 text-right">CGST</th>
                  <th className="py-3 px-3 text-right">SGST</th>
                  <th className="py-3 px-3 text-right">Total Tax Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{line.poNumber}</td>
                    <td className="py-3 px-3 text-slate-500">{line.poDate}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{line.supplierName}</td>
                    <td className="py-3 px-2 font-mono text-slate-600">{line.hsnCode}</td>
                    <td className="py-3 px-3 text-right font-mono">₹{line.taxableValue.toFixed(2)}</td>
                    <td className="py-3 px-2 text-center font-bold text-indigo-600">{line.gstRate}%</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">₹{line.cgst.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">₹{line.sgst.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">₹{(line.cgst + line.sgst).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
