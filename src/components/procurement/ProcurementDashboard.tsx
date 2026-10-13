import React, { useMemo } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  FileCheck2,
  Clock,
  AlertTriangle,
  PackageCheck,
  Receipt,
  Truck,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { useAppState } from '../../context/AppStateContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const ProcurementDashboard = ({ onNavigateTab }: { onNavigateTab: (tabId: string) => void }) => {
  const {
    requisitions,
    purchaseOrders,
    grns,
    supplierInvoices,
    suppliers,
    activeBranch,
    activeDepartment
  } = useProcurement();

  const { orgType, medicines } = useAppState();

  // Metrics computation
  const metrics = useMemo(() => {
    // 1. Total PO value
    const totalPoSpend = purchaseOrders.reduce((sum, po) => sum + (po.status !== 'Cancelled' ? po.totalAmount : 0), 0);

    // 2. PO Status counts
    const raisedPos = purchaseOrders.length;
    const pendingApprovalPos = purchaseOrders.filter(po => po.status === 'Pending Approval').length;
    const issuedOrApprovedPos = purchaseOrders.filter(po => po.status === 'Issued' || po.status === 'Approved' || po.status === 'Partially Delivered').length;
    const deliveredPos = purchaseOrders.filter(po => po.status === 'Delivered' || po.status === 'Closed').length;
    const cancelledPos = purchaseOrders.filter(po => po.status === 'Cancelled').length;

    // 3. Requisitions
    const pendingRequisitions = requisitions.filter(r => r.status === 'Submitted' || r.status === 'Pending Approval').length;
    const approvedRequisitions = requisitions.filter(r => r.status === 'Approved').length;

    // 4. Deliveries awaiting receipt & overdue
    const awaitingDelivery = purchaseOrders.filter(po => po.status === 'Issued' || po.status === 'Partially Delivered').length;
    const now = new Date().toISOString().split('T')[0];
    const overdueDeliveries = purchaseOrders.filter(
      po => (po.status === 'Issued' || po.status === 'Partially Delivered') && po.expectedDeliveryDate < now
    ).length;

    // 5. GRNs under inspection
    const grnsAwaitingInspection = grns.filter(g => g.status === 'Under Inspection').length;

    // 6. Invoices awaiting 3-way match verification
    const invoicesPendingVerification = supplierInvoices.filter(i => i.status === 'Pending Match' || i.status === 'Discrepancy Flagged').length;

    // 7. Low stock items in inventory requiring procurement replenishment
    const lowStockCount = medicines.filter(m => m.stock <= (m.minStockAlert ?? 50)).length;

    return {
      totalPoSpend,
      raisedPos,
      pendingApprovalPos,
      issuedOrApprovedPos,
      deliveredPos,
      cancelledPos,
      pendingRequisitions,
      approvedRequisitions,
      awaitingDelivery,
      overdueDeliveries,
      grnsAwaitingInspection,
      invoicesPendingVerification,
      lowStockCount
    };
  }, [purchaseOrders, requisitions, grns, supplierInvoices, medicines]);

  // Chart 1: Spend by Category
  const categorySpendData = useMemo(() => {
    const map: { [key: string]: number } = {};
    purchaseOrders.forEach(po => {
      if (po.status !== 'Cancelled') {
        po.items.forEach(item => {
          map[item.category] = (map[item.category] || 0) + item.totalAmount;
        });
      }
    });

    return Object.entries(map).map(([name, value]) => ({
      name: name.length > 20 ? name.substring(0, 18) + '...' : name,
      fullName: name,
      value: Math.round(value)
    }));
  }, [purchaseOrders]);

  // Chart 2: Monthly Procurement Spend
  const monthlySpendData = [
    { month: 'Jun', spend: 28500 },
    { month: 'Jul', spend: 34200 },
    { month: 'Aug', spend: 31800 },
    { month: 'Sep', spend: 39500 },
    { month: 'Oct (Current)', spend: Math.round(metrics.totalPoSpend) }
  ];

  const PIE_COLORS = ['#0D9488', '#0F172A', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">

      {/* ─── Top KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Purchase Value</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-navy-900">
            ₹{metrics.totalPoSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Across {purchaseOrders.length} Purchase Orders</span>
          </div>
        </div>

        {/* Pending Requisitions */}
        <div
          onClick={() => onNavigateTab('requisitions')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Requisitions</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {metrics.pendingRequisitions} <span className="text-xs font-medium text-slate-500">requests</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Awaiting Director review</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* POs Awaiting Delivery */}
        <div
          onClick={() => onNavigateTab('purchase_orders')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Awaiting Supplier Delivery</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            {metrics.awaitingDelivery} <span className="text-xs font-medium text-slate-500">orders</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.overdueDeliveries > 0 ? (
              <span className="text-red-600 font-bold">⚠️ {metrics.overdueDeliveries} delivery overdue</span>
            ) : (
              <span className="text-emerald-600">✓ On-schedule with suppliers</span>
            )}
          </div>
        </div>

        {/* GRN & Invoice 3-Way Match */}
        <div
          onClick={() => onNavigateTab('invoice_matching')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">3-Way Match Verification</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700">
            {metrics.invoicesPendingVerification} <span className="text-xs font-medium text-slate-500">invoices</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>PO vs GRN vs Bill Reconciliation</span>
          </div>
        </div>
      </div>

      {/* ─── Reorder Integration & Quick Alerts Banner ─── */}
      {metrics.lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Inventory Reorder Trigger Active</h4>
              <p className="text-xs text-amber-100">
                {metrics.lowStockCount} medicines/consumables have fallen below their configured minimum stock thresholds.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('requisitions')}
            className="bg-white text-amber-900 hover:bg-amber-50 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs"
          >
            Create Auto-Requisition ↗
          </button>
        </div>
      )}

      {/* ─── CHARTS ROW ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-navy-900 text-sm">Procurement Expenditure Trend (INR)</h3>
              <p className="text-xs text-slate-500">Monthly total landed procurement cost over the last 5 months</p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              Target Budget: ₹50,000 / mo
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySpendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Expenditure']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="spend" fill="#0D9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-navy-900 text-sm">Category-Wise Spend</h3>
            <p className="text-xs text-slate-500 mb-4">Distribution of procurement purchases by department</p>
            
            <div className="space-y-3">
              {categorySpendData.map((item, index) => {
                const total = metrics.totalPoSpend || 1;
                const percent = Math.round((item.value / total) * 100);
                return (
                  <div key={item.fullName} className="text-xs">
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span className="truncate max-w-[180px]">{item.fullName}</span>
                      <span className="font-bold text-navy-900">₹{item.value.toLocaleString()} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: PIE_COLORS[index % PIE_COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Active Suppliers: <strong className="text-navy-900">{suppliers.length}</strong></span>
            <button
              onClick={() => onNavigateTab('suppliers')}
              className="text-teal-600 hover:underline font-semibold"
            >
              View Vendors ↗
            </button>
          </div>
        </div>
      </div>

      {/* ─── RECENT PROCUREMENT TRANSACTIONS & DRILL-DOWN TABLE ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-navy-900 text-sm">Recent Purchase Orders &amp; Delivery Tracking</h3>
            <p className="text-xs text-slate-500">Live order status, supplier lead time, and received reconciliation</p>
          </div>
          <button
            onClick={() => onNavigateTab('purchase_orders')}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-3.5 py-1.5 rounded-xl border border-teal-200"
          >
            Open All Purchase Orders →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">PO Number</th>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">PO Date</th>
                <th className="px-4 py-3">Expected Delivery</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.map(po => {
                const todayStr = new Date().toISOString().split('T')[0];
                const isOverdue = po.expectedDeliveryDate < todayStr && po.status !== 'Delivered' && po.status !== 'Cancelled';
                return (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-navy-900">
                      {po.poNumber}
                      {po.revisionNumber > 0 && <span className="ml-1 text-[10px] text-slate-400">(Rev {po.revisionNumber})</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{po.supplierName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">GSTIN: {po.supplierGstin}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{po.poDate}</td>
                    <td className="px-4 py-3.5">
                      <div className={`font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                        {po.expectedDeliveryDate}
                        {isOverdue && <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-red-100 text-red-700 rounded">OVERDUE</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-teal-700">
                      ₹{po.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        po.status === 'Approved' || po.status === 'Issued'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : po.status === 'Delivered' || po.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : po.status === 'Partially Delivered'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onNavigateTab('goods_receipt')}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
                      >
                        Create GRN
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
