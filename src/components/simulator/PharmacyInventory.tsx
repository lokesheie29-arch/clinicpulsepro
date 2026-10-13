import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  PlusCircle,
  Download,
  Mail,
  Smartphone,
  Calendar,
  Package,
  Clock,
  CheckCircle2,
  Bell,
  Search,
  Edit2,
  DollarSign,
  TrendingDown,
  X,
  Send,
  Copy,
  Check
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { Medicine } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import confetti from 'canvas-confetti';
import { useUser } from '@clerk/react';

// Expiry Tier Types
type ExpiryTier = 'expired' | '1month' | '3months' | '6months' | '1year' | 'safe';

interface ExpiryStatusInfo {
  tier: ExpiryTier;
  label: string;
  badgeClass: string;
  daysDiff: number;
}

export const PharmacyInventory = () => {
  const { medicines, restockMedicine, addMedicine, updateMedicine, orgType } = useAppState();
  const { user } = useUser();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [alertFilter, setAlertFilter] = useState<string>('all'); // all, low_stock, expired, 1month, 3months, 6months, 1year
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAlertCenter, setShowAlertCenter] = useState(true);
  const [editingThresholdMed, setEditingThresholdMed] = useState<Medicine | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(50);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  // Registered user contact info
  const registeredEmail =
    (user?.primaryEmailAddress?.emailAddress as string) ||
    (user?.unsafeMetadata?.hospitalEmail as string) ||
    localStorage.getItem('clinicpulse_clinic_email') ||
    'lokesheie29@gmail.com';

  const registeredPhone =
    (user?.unsafeMetadata?.hospitalPhone as string) ||
    localStorage.getItem('clinicpulse_clinic_phone') ||
    '+91 7200124136';

  const facilityName =
    (user?.unsafeMetadata?.clinicName as string) ||
    localStorage.getItem('clinicpulse_clinic_name') ||
    (orgType === 'pharmacy' ? 'CLINICPULSE PHARMACY & HEALTHCARE' : 'CLINICPULSE PRO HOSPITAL');

  // Form state for Add Medicine
  const [newMed, setNewMed] = useState<Partial<Medicine>>({
    genericName: '',
    brandName: '',
    batchNo: '',
    hsn: '3004',
    costPrice: 0,
    sellingPrice: 0,
    gstRate: 12,
    stock: 0,
    minStockAlert: 50, // Default low stock alert threshold
    expiryDate: '',
    category: 'General'
  });

  // Calculate detailed expiry tier for any medicine
  const getExpiryStatus = (dateStr: string): ExpiryStatusInfo => {
    const exp = new Date(dateStr);
    const now = new Date();
    // Normalize to date boundary
    const expDate = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        tier: 'expired',
        label: `Expired (${Math.abs(diffDays)}d ago)`,
        badgeClass: 'text-red-700 bg-red-100 border border-red-300',
        daysDiff: diffDays
      };
    }
    if (diffDays <= 30) {
      return {
        tier: '1month',
        label: `Expiring in ${diffDays}d (< 1 Mo)`,
        badgeClass: 'text-rose-700 bg-rose-100 border border-rose-300 font-bold',
        daysDiff: diffDays
      };
    }
    if (diffDays <= 90) {
      return {
        tier: '3months',
        label: `Expiring in ${diffDays}d (< 3 Mos)`,
        badgeClass: 'text-amber-700 bg-amber-100 border border-amber-300',
        daysDiff: diffDays
      };
    }
    if (diffDays <= 180) {
      return {
        tier: '6months',
        label: `Expiring in ${diffDays}d (< 6 Mos)`,
        badgeClass: 'text-yellow-800 bg-yellow-100 border border-yellow-300',
        daysDiff: diffDays
      };
    }
    if (diffDays <= 365) {
      return {
        tier: '1year',
        label: `Expiring in ${diffDays}d (< 1 Yr)`,
        badgeClass: 'text-blue-700 bg-blue-50 border border-blue-200',
        daysDiff: diffDays
      };
    }
    return {
      tier: 'safe',
      label: `Safe (> 1 Yr)`,
      badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
      daysDiff: diffDays
    };
  };

  // Categories list
  const categories = ['All', ...Array.from(new Set(medicines.map(m => m.category)))];

  // Metrics summary
  const totalStockUnits = medicines.reduce((acc, m) => acc + m.stock, 0);
  const totalCostValuation = medicines.reduce((acc, m) => acc + (m.stock * m.costPrice), 0);
  const totalRetailValuation = medicines.reduce((acc, m) => acc + (m.stock * m.sellingPrice), 0);

  const lowStockMeds = medicines.filter(m => m.stock <= (m.minStockAlert ?? 50));
  const expiredMeds = medicines.filter(m => getExpiryStatus(m.expiryDate).tier === 'expired');
  const exp1MonthMeds = medicines.filter(m => getExpiryStatus(m.expiryDate).tier === '1month');
  const exp3MonthsMeds = medicines.filter(m => getExpiryStatus(m.expiryDate).tier === '3months');
  const exp6MonthsMeds = medicines.filter(m => getExpiryStatus(m.expiryDate).tier === '6months');
  const exp1YearMeds = medicines.filter(m => getExpiryStatus(m.expiryDate).tier === '1year');

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter(med => {
      // Category filter
      if (categoryFilter !== 'All' && med.category !== categoryFilter) return false;

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          med.brandName.toLowerCase().includes(q) ||
          med.genericName.toLowerCase().includes(q) ||
          med.batchNo.toLowerCase().includes(q) ||
          med.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Alert filter
      const expStatus = getExpiryStatus(med.expiryDate);
      const isLow = med.stock <= (med.minStockAlert ?? 50);

      if (alertFilter === 'low_stock' && !isLow) return false;
      if (alertFilter === 'expired' && expStatus.tier !== 'expired') return false;
      if (alertFilter === '1month' && expStatus.tier !== '1month') return false;
      if (alertFilter === '3months' && expStatus.tier !== '3months') return false;
      if (alertFilter === '6months' && expStatus.tier !== '6months') return false;
      if (alertFilter === '1year' && expStatus.tier !== '1year') return false;

      return true;
    });
  }, [medicines, categoryFilter, alertFilter, searchQuery]);

  // 1. One-Click Excel / CSV Download
  const handleDownloadInventoryExcel = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00A896', '#0D9488', '#0F4C81']
    });

    // CSV Header row
    const headers = [
      'S.No',
      'Brand Name',
      'Generic Name',
      'Batch No',
      'Category',
      'HSN Code',
      'Cost Price (INR)',
      'Selling Price (INR)',
      'GST Rate (%)',
      'Current Stock (Units)',
      'Low Stock Alert Level',
      'Stock Valuation - Cost (INR)',
      'Stock Valuation - Retail (INR)',
      'Expiry Date',
      'Days to Expiry',
      'Expiry Alert Status',
      'Inventory Stock Status'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = medicines.map((m, idx) => {
      const expStatus = getExpiryStatus(m.expiryDate);
      const threshold = m.minStockAlert ?? 50;
      const isLow = m.stock <= threshold;
      const stockStatus = isLow ? 'LOW STOCK ALERT' : 'OPTIMAL STOCK';
      const costVal = (m.stock * m.costPrice).toFixed(2);
      const retailVal = (m.stock * m.sellingPrice).toFixed(2);

      return [
        idx + 1,
        escapeCsv(m.brandName),
        escapeCsv(m.genericName),
        escapeCsv(m.batchNo),
        escapeCsv(m.category),
        escapeCsv(m.hsn),
        m.costPrice.toFixed(2),
        m.sellingPrice.toFixed(2),
        m.gstRate,
        m.stock,
        threshold,
        costVal,
        retailVal,
        m.expiryDate,
        expStatus.daysDiff,
        escapeCsv(expStatus.label),
        escapeCsv(stockStatus)
      ].join(',');
    });

    // Summary footer rows
    const summaryRows = [
      '',
      `"TOTAL UNIQUE SKUs",${medicines.length}`,
      `"TOTAL STOCK QUANTITY",${totalStockUnits}`,
      `"TOTAL INVENTORY COST VALUE",${totalCostValuation.toFixed(2)}`,
      `"TOTAL INVENTORY RETAIL VALUE",${totalRetailValuation.toFixed(2)}`,
      `"LOW STOCK ITEMS COUNT",${lowStockMeds.length}`,
      `"EXPIRED ITEMS COUNT",${expiredMeds.length}`,
      `"EXPIRING WITHIN 1 MONTH",${exp1MonthMeds.length}`,
      `"EXPIRING WITHIN 3 MONTHS",${exp3MonthsMeds.length}`,
      `"EXPIRING WITHIN 6 MONTHS",${exp6MonthsMeds.length}`,
      `"EXPIRING WITHIN 1 YEAR",${exp1YearMeds.length}`
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...rows, ...summaryRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `ClinicPulse_Total_Inventory_Stock_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setAlertSuccessMsg('Total inventory stock details downloaded successfully as Excel CSV!');
  };

  // 2. Add Medicine with minStockAlert
  const handleAddMedicine = () => {
    if (!newMed.brandName || !newMed.expiryDate) {
      alert('Please provide Brand Name and Expiry Date.');
      return;
    }

    addMedicine({
      id: `med-${uuidv4().substring(0, 8)}`,
      genericName: newMed.genericName || newMed.brandName,
      brandName: newMed.brandName,
      batchNo: newMed.batchNo || `B${new Date().getFullYear()}${Math.floor(10 + Math.random() * 90)}`,
      hsn: newMed.hsn || '3004',
      costPrice: Number(newMed.costPrice) || 0,
      sellingPrice: Number(newMed.sellingPrice) || 0,
      gstRate: Number(newMed.gstRate) || 12,
      stock: Number(newMed.stock) || 0,
      minStockAlert: Number(newMed.minStockAlert) || 50,
      expiryDate: newMed.expiryDate,
      category: newMed.category || 'General'
    } as Medicine);

    setShowAddModal(false);
    setNewMed({
      genericName: '',
      brandName: '',
      batchNo: '',
      hsn: '3004',
      costPrice: 0,
      sellingPrice: 0,
      gstRate: 12,
      stock: 0,
      minStockAlert: 50,
      expiryDate: '',
      category: 'General'
    });
    setAlertSuccessMsg('New medicine added with customized low stock alert threshold!');
  };

  // 3. Quick Update Low Stock Threshold for Existing Medicine
  const handleSaveThreshold = () => {
    if (editingThresholdMed) {
      updateMedicine(editingThresholdMed.id, { minStockAlert: tempThreshold });
      setEditingThresholdMed(null);
      setAlertSuccessMsg(`Updated low stock alert threshold for ${editingThresholdMed.brandName} to ${tempThreshold} units.`);
    }
  };

  // 4. Generate Structured Daily Report Text (for WhatsApp & Email)
  const generateDailyAlertReportText = () => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    let text = `*CLINICPULSE PRO - Daily Medicine Inventory Alert Report*\n`;
    text += `📅 Date: ${today}\n`;
    text += `🏥 Facility: ${facilityName}\n`;
    text += `📧 Registered Email: ${registeredEmail}\n\n`;

    // 1 Month Expiry
    text += `🚨 *1. EXPIRING WITHIN 1 MONTH (≤ 30 Days):* ${exp1MonthMeds.length} items\n`;
    if (exp1MonthMeds.length === 0) {
      text += `   ✓ None\n`;
    } else {
      exp1MonthMeds.forEach(m => {
        text += `   • *${m.brandName}* (Batch: ${m.batchNo}) | Exp: ${m.expiryDate} | Stock: ${m.stock} units\n`;
      });
    }
    text += `\n`;

    // 3 Months Expiry
    text += `⚠️ *2. EXPIRING WITHIN 3 MONTHS (31–90 Days):* ${exp3MonthsMeds.length} items\n`;
    if (exp3MonthsMeds.length === 0) {
      text += `   ✓ None\n`;
    } else {
      exp3MonthsMeds.forEach(m => {
        text += `   • *${m.brandName}* (Batch: ${m.batchNo}) | Exp: ${m.expiryDate} | Stock: ${m.stock} units\n`;
      });
    }
    text += `\n`;

    // 6 Months Expiry
    text += `🟡 *3. EXPIRING WITHIN 6 MONTHS (91–180 Days):* ${exp6MonthsMeds.length} items\n`;
    if (exp6MonthsMeds.length === 0) {
      text += `   ✓ None\n`;
    } else {
      exp6MonthsMeds.forEach(m => {
        text += `   • *${m.brandName}* (Batch: ${m.batchNo}) | Exp: ${m.expiryDate} | Stock: ${m.stock} units\n`;
      });
    }
    text += `\n`;

    // 1 Year Expiry
    text += `🔵 *4. EXPIRING WITHIN 1 YEAR (181–365 Days):* ${exp1YearMeds.length} items\n`;
    if (exp1YearMeds.length === 0) {
      text += `   ✓ None\n`;
    } else {
      exp1YearMeds.forEach(m => {
        text += `   • *${m.brandName}* (Batch: ${m.batchNo}) | Exp: ${m.expiryDate} | Stock: ${m.stock} units\n`;
      });
    }
    text += `\n`;

    // Expired
    text += `🔴 *5. ALREADY EXPIRED MEDICINES:* ${expiredMeds.length} items\n`;
    if (expiredMeds.length === 0) {
      text += `   ✓ None\n`;
    } else {
      expiredMeds.forEach(m => {
        text += `   • *${m.brandName}* (Batch: ${m.batchNo}) | Expired: ${m.expiryDate} | Stock: ${m.stock} units\n`;
      });
    }
    text += `\n`;

    // Low stock alerts
    text += `📉 *6. LOW STOCK ALERTS (Stock ≤ Min Alert):* ${lowStockMeds.length} items\n`;
    if (lowStockMeds.length === 0) {
      text += `   ✓ All stocks healthy\n`;
    } else {
      lowStockMeds.forEach(m => {
        const threshold = m.minStockAlert ?? 50;
        const deficit = threshold - m.stock;
        text += `   • *${m.brandName}*: Current *${m.stock}* units (Alert Level: ${threshold} | Deficit: ${deficit})\n`;
      });
    }
    text += `\n`;

    text += `📊 *Summary:* Total Stock: ${totalStockUnits} units | Valuation: ₹${totalCostValuation.toFixed(2)}\n`;
    text += `*** CLINICPULSE PRO FEFO PHARMACY INVENTORY INTELLIGENCE ***`;

    return text;
  };

  // 5. Send Daily Alert via WhatsApp
  const handleSendWhatsAppAlert = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#25D366', '#0D9488', '#0F172A']
    });

    const cleanPhone = registeredPhone.replace(/\D/g, '');
    const reportText = generateDailyAlertReportText();
    const encoded = encodeURIComponent(reportText);

    window.open(`https://wa.me/91${cleanPhone}?text=${encoded}`, '_blank');
    setAlertSuccessMsg(`Daily inventory alert report dispatched to registered WhatsApp (+91 ${cleanPhone})!`);
  };

  // 6. Send Daily Alert via Email
  const handleSendEmailAlert = () => {
    const reportText = generateDailyAlertReportText();
    const subject = encodeURIComponent(`Daily Medicine Stock & Expiry Alert - ${facilityName}`);
    const body = encodeURIComponent(reportText);

    // Launch mailto
    window.open(`mailto:${registeredEmail}?subject=${subject}&body=${body}`, '_blank');
    setShowEmailModal(false);
    setAlertSuccessMsg(`Daily inventory alert email dispatched to ${registeredEmail}!`);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generateDailyAlertReportText());
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-6">

      {/* Success Notification Banner */}
      {alertSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{alertSuccessMsg}</span>
          </span>
          <button onClick={() => setAlertSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* ─── TOP METRICS SUMMARY CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Total Inventory</span>
            <Package className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-xl font-extrabold text-navy-900">{totalStockUnits.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">{medicines.length} Unique SKUs | ₹{totalCostValuation.toFixed(0)} cost</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Low Stock Alerts</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-xl font-extrabold text-red-600">{lowStockMeds.length} <span className="text-xs font-normal text-slate-500">items</span></div>
          <div className="text-[11px] text-slate-500 mt-0.5">Below custom alert threshold</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Expiring ≤ 3 Months</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold text-amber-600">
            {exp1MonthMeds.length + exp3MonthsMeds.length + expiredMeds.length} <span className="text-xs font-normal text-slate-500">items</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{exp1MonthMeds.length} critical (&lt;1 Mo) | {expiredMeds.length} expired</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Stock Valuation</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-teal-700">₹{totalRetailValuation.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Est. Retail / Dispense value</div>
        </div>
      </div>

      {/* ─── DAILY STOCK & EXPIRY ALERTS HUB (VIEW MODULE) ─── */}
      <div className="bg-gradient-to-r from-navy-900 via-slate-900 to-teal-950 text-white rounded-2xl p-5 shadow-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <Bell className="h-3.5 w-3.5 animate-pulse" />
              <span>Daily Automated Alert System • Active</span>
            </div>
            <h3 className="text-lg font-bold">Stock &amp; Multi-Tier Expiry Intelligence Center</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Daily automated alerts for <strong className="text-white">Low Stock</strong> and <strong className="text-white">1 Year, 6 Months, 3 Months &amp; 1 Month</strong> Expiry timelines.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
              <span>📧 Registered Email: <strong className="text-teal-300">{registeredEmail}</strong></span>
              <span>📱 WhatsApp: <strong className="text-teal-300">{registeredPhone}</strong></span>
              <span>⏰ Frequency: <strong className="text-white">Daily (09:00 AM)</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
            {/* One-Click Excel Download */}
            <button
              onClick={handleDownloadInventoryExcel}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Download total stock details into Excel format (.csv)"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>1-Click Excel Download</span>
            </button>

            {/* Daily WhatsApp Alert */}
            <button
              onClick={handleSendWhatsAppAlert}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-1.5 bg-[#25D366] hover:bg-[#1DA851] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Dispatch daily stock & expiry report to registered WhatsApp"
            >
              <Smartphone className="h-4 w-4 shrink-0" />
              <span>Daily WhatsApp Alert</span>
            </button>

            {/* Daily Email Alert */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all"
              title="Preview and send daily alert digest to registered email"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span>Daily Email Alert</span>
            </button>
          </div>
        </div>

        {/* Expiry Tiers Visual Radar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
          <button
            onClick={() => setAlertFilter(alertFilter === '1month' ? 'all' : '1month')}
            className={`p-2 rounded-xl text-xs transition-all ${
              alertFilter === '1month' ? 'bg-rose-500 text-white font-bold ring-2 ring-rose-300' : 'bg-white/5 hover:bg-white/10 text-rose-300'
            }`}
          >
            <div className="text-base font-extrabold">{exp1MonthMeds.length}</div>
            <div className="text-[10px]">&lt; 1 Month</div>
          </button>

          <button
            onClick={() => setAlertFilter(alertFilter === '3months' ? 'all' : '3months')}
            className={`p-2 rounded-xl text-xs transition-all ${
              alertFilter === '3months' ? 'bg-amber-500 text-white font-bold ring-2 ring-amber-300' : 'bg-white/5 hover:bg-white/10 text-amber-300'
            }`}
          >
            <div className="text-base font-extrabold">{exp3MonthsMeds.length}</div>
            <div className="text-[10px]">&lt; 3 Months</div>
          </button>

          <button
            onClick={() => setAlertFilter(alertFilter === '6months' ? 'all' : '6months')}
            className={`p-2 rounded-xl text-xs transition-all ${
              alertFilter === '6months' ? 'bg-yellow-500 text-white font-bold ring-2 ring-yellow-300' : 'bg-white/5 hover:bg-white/10 text-yellow-300'
            }`}
          >
            <div className="text-base font-extrabold">{exp6MonthsMeds.length}</div>
            <div className="text-[10px]">&lt; 6 Months</div>
          </button>

          <button
            onClick={() => setAlertFilter(alertFilter === '1year' ? 'all' : '1year')}
            className={`p-2 rounded-xl text-xs transition-all ${
              alertFilter === '1year' ? 'bg-blue-500 text-white font-bold ring-2 ring-blue-300' : 'bg-white/5 hover:bg-white/10 text-blue-300'
            }`}
          >
            <div className="text-base font-extrabold">{exp1YearMeds.length}</div>
            <div className="text-[10px]">&lt; 1 Year</div>
          </button>

          <button
            onClick={() => setAlertFilter(alertFilter === 'low_stock' ? 'all' : 'low_stock')}
            className={`p-2 rounded-xl text-xs transition-all ${
              alertFilter === 'low_stock' ? 'bg-red-500 text-white font-bold ring-2 ring-red-300' : 'bg-white/5 hover:bg-white/10 text-red-300'
            }`}
          >
            <div className="text-base font-extrabold">{lowStockMeds.length}</div>
            <div className="text-[10px]">Low Stock</div>
          </button>

          <button
            onClick={() => setAlertFilter(alertFilter === 'expired' ? 'all' : 'expired')}
            className={`p-2 rounded-xl text-xs transition-all ${
              alertFilter === 'expired' ? 'bg-red-700 text-white font-bold ring-2 ring-red-400' : 'bg-white/5 hover:bg-white/10 text-red-400'
            }`}
          >
            <div className="text-base font-extrabold">{expiredMeds.length}</div>
            <div className="text-[10px]">Expired</div>
          </button>
        </div>
      </div>

      {/* ─── TOOLBAR: FILTERS, SEARCH & ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search medicine, batch..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Add Medicine Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Active Filter Pill indicator */}
      {alertFilter !== 'all' && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-xs text-amber-800">
          <span>Filtering by: <strong>{alertFilter.toUpperCase()}</strong> ({filteredMedicines.length} medicines)</span>
          <button
            onClick={() => setAlertFilter('all')}
            className="text-amber-700 hover:underline font-bold"
          >
            Clear Filter (Show All)
          </button>
        </div>
      )}

      {/* ─── MEDICINES INVENTORY TABLE ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Medicine &amp; Batch</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Price (SP / CP)</th>
                <th className="px-4 py-3.5 text-center">Stock / Alert Level</th>
                <th className="px-4 py-3.5 text-center">Expiry &amp; Alert Tier</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map(med => {
                const status = getExpiryStatus(med.expiryDate);
                const threshold = med.minStockAlert ?? 50;
                const isLowStock = med.stock <= threshold;

                return (
                  <tr key={med.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Medicine Name & Batch */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-navy-900">{med.brandName}</div>
                      <div className="text-xs text-slate-500">
                        {med.genericName} &nbsp;|&nbsp; Batch: <span className="font-mono">{med.batchNo}</span> &nbsp;|&nbsp; HSN: {med.hsn}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                        {med.category}
                      </span>
                    </td>

                    {/* Selling / Cost Price */}
                    <td className="px-4 py-4">
                      <div className="font-semibold text-teal-700">₹{med.sellingPrice.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">Cost: ₹{med.costPrice.toFixed(2)}</div>
                    </td>

                    {/* Stock & Low Stock Alert Level */}
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className={`inline-flex items-center space-x-1 font-bold ${isLowStock ? 'text-red-600' : 'text-slate-800'}`}>
                          {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />}
                          <span className="text-sm">{med.stock}</span>
                          <span className="text-slate-400 font-normal text-xs">/ {threshold} min</span>
                        </div>
                        {isLowStock ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded mt-0.5">
                            LOW STOCK (Deficit: {threshold - med.stock})
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600">Optimal</span>
                        )}
                        {/* Quick edit threshold button */}
                        <button
                          onClick={() => {
                            setEditingThresholdMed(med);
                            setTempThreshold(threshold);
                          }}
                          className="text-[10px] text-slate-400 hover:text-teal-600 mt-0.5 flex items-center gap-0.5"
                          title="Click to change low stock alert quantity"
                        >
                          <Edit2 className="h-2.5 w-2.5" />
                          <span>Edit Alert Qty</span>
                        </button>
                      </div>
                    </td>

                    {/* Expiry & Alert Tier */}
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.badgeClass}`}>
                        {status.label}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Exp: {new Date(med.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => restockMedicine(med.id, 100)}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors border border-teal-200"
                      >
                        +100 Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredMedicines.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No medicines match the selected filter or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL 1: ADD NEW MEDICINE (WITH LOW STOCK ALERT SETTING) ─── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Add New Medicine</h3>
                <p className="text-xs text-slate-500">Configure medicine specs and set custom low stock alert quantity.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={newMed.brandName}
                    onChange={e => setNewMed({ ...newMed, brandName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. Dolo 650"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Generic Name</label>
                  <input
                    type="text"
                    value={newMed.genericName}
                    onChange={e => setNewMed({ ...newMed, genericName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. Paracetamol 650mg"
                  />
                </div>
              </div>

              {/* Batch, Category & HSN */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Batch No</label>
                  <input
                    type="text"
                    value={newMed.batchNo}
                    onChange={e => setNewMed({ ...newMed, batchNo: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                    placeholder="e.g. B202611"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={newMed.category}
                    onChange={e => setNewMed({ ...newMed, category: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                    placeholder="e.g. Analgesics"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={newMed.hsn}
                    onChange={e => setNewMed({ ...newMed, hsn: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                    placeholder="3004"
                  />
                </div>
              </div>

              {/* Pricing & GST */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMed.costPrice}
                    onChange={e => setNewMed({ ...newMed, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMed.sellingPrice}
                    onChange={e => setNewMed({ ...newMed, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none font-semibold text-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">GST Rate (%)</label>
                  <select
                    value={newMed.gstRate}
                    onChange={e => setNewMed({ ...newMed, gstRate: parseInt(e.target.value) || 12 })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none bg-white"
                  >
                    <option value="12">12%</option>
                    <option value="5">5%</option>
                    <option value="18">18%</option>
                    <option value="0">0%</option>
                  </select>
                </div>
              </div>

              {/* Stock, Low Stock Alert Level & Expiry */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Stock (Units)</label>
                  <input
                    type="number"
                    value={newMed.stock}
                    onChange={e => setNewMed({ ...newMed, stock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none font-bold"
                    placeholder="e.g. 100"
                  />
                </div>

                {/* ── REQUIREMENT 2: LOW STOCK QUANTITY ALERT SET OPTION ── */}
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Low Stock Alert Level *
                  </label>
                  <input
                    type="number"
                    value={newMed.minStockAlert}
                    onChange={e => setNewMed({ ...newMed, minStockAlert: parseInt(e.target.value) || 20 })}
                    className="w-full p-1.5 border border-amber-300 rounded-lg text-sm font-extrabold text-amber-900 bg-white outline-none"
                    placeholder="e.g. 50"
                  />
                  <span className="text-[10px] text-amber-700 block mt-1 leading-tight">
                    Alert triggers when stock falls ≤ this value
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    value={newMed.expiryDate}
                    onChange={e => setNewMed({ ...newMed, expiryDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                  />
                </div>
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
                onClick={handleAddMedicine}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Save Medicine &amp; Alert Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: EDIT LOW STOCK ALERT THRESHOLD FOR EXISTING MEDICINE ─── */}
      {editingThresholdMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-navy-900 text-sm">Set Low Stock Alert Quantity</h4>
                <p className="text-xs text-slate-500">{editingThresholdMed.brandName} ({editingThresholdMed.batchNo})</p>
              </div>
              <button onClick={() => setEditingThresholdMed(null)} className="text-slate-400 font-bold text-lg">×</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Current Stock: <span className="font-bold text-navy-900">{editingThresholdMed.stock} units</span></label>
                <label className="block text-xs font-bold text-amber-900 mt-2 mb-1">Alert Quantity Threshold (Units):</label>
                <input
                  type="number"
                  value={tempThreshold}
                  onChange={e => setTempThreshold(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 border border-amber-300 rounded-lg text-base font-extrabold text-navy-900 outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  When stock reaches {tempThreshold} or below, an automated alert will be flagged and dispatched in daily digests.
                </p>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setEditingThresholdMed(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
              <button onClick={handleSaveThreshold} className="px-4 py-1.5 text-xs text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-bold shadow-xs">Update Threshold</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: DAILY EMAIL ALERT PREVIEW & DISPATCH ─── */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-navy-900 text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-teal-600" />
                  <span>Daily Medicine Stock &amp; Expiry Digest Email</span>
                </h4>
                <p className="text-xs text-slate-500">Scheduled daily dispatch to: <strong className="text-teal-700">{registeredEmail}</strong></p>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 font-bold text-lg">×</button>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {generateDailyAlertReportText()}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={handleCopyEmail}
                className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-navy-900 font-medium px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white"
              >
                {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedEmail ? 'Copied!' : 'Copy Report Text'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={handleSendEmailAlert}
                  className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send to {registeredEmail}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
