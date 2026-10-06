import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IndianRupee, TrendingUp, Users, Activity } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';

export const Analytics = () => {
  const { invoices, medicines } = useAppState();

  const metrics = useMemo(() => {
    let consultationIncome = 0;
    let pharmacySales = 0;
    let medicineCOGS = 0;
    let totalPatients = invoices.length;

    invoices.forEach(inv => {
      consultationIncome += inv.consultationFee;
      inv.prescriptionItems.forEach(item => {
        pharmacySales += item.totalPrice;
        // Find matching med to get COGS
        const med = medicines.find(m => m.id === item.medicineId);
        if (med) {
          medicineCOGS += med.costPrice * item.quantity;
        }
      });
    });

    const grossRevenue = consultationIncome + pharmacySales;
    const operatingOverheads = 1500; // Fixed demo overhead per day
    const netProfit = grossRevenue - (medicineCOGS + operatingOverheads);
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return {
      grossRevenue,
      consultationIncome,
      pharmacySales,
      medicineCOGS,
      operatingOverheads,
      netProfit,
      profitMargin,
      totalPatients
    };
  }, [invoices, medicines]);

  // Mock data for last 7 days chart, plus today's actual data
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 1; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      data.push({
        name: date.toLocaleDateString('en-GB', { weekday: 'short' }),
        Consultation: Math.floor(Math.random() * 5000) + 1000,
        Pharmacy: Math.floor(Math.random() * 8000) + 2000,
      });
    }

    // Add actual today
    data.push({
      name: 'Today',
      Consultation: metrics.consultationIncome,
      Pharmacy: metrics.pharmacySales
    });

    return data;
  }, [metrics]);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Gross Revenue" 
          value={`₹${metrics.grossRevenue.toFixed(0)}`}
          icon={<IndianRupee className="h-6 w-6 text-teal-600" />}
          trend="+12%"
          bg="bg-teal-50"
        />
        <KpiCard 
          title="Net Profit" 
          value={`₹${metrics.netProfit.toFixed(0)}`}
          icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
          trend={`${metrics.profitMargin.toFixed(1)}% Margin`}
          bg="bg-emerald-50"
        />
        <KpiCard 
          title="Total Patients" 
          value={metrics.totalPatients.toString()}
          icon={<Users className="h-6 w-6 text-indigo-600" />}
          trend="Today"
          bg="bg-indigo-50"
        />
        <KpiCard 
          title="Pharmacy Sales" 
          value={`₹${metrics.pharmacySales.toFixed(0)}`}
          icon={<Activity className="h-6 w-6 text-rose-600" />}
          trend={`COGS: ₹${metrics.medicineCOGS.toFixed(0)}`}
          bg="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-navy-900 mb-6">Revenue Split (7 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `₹${val}`} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '14px', paddingTop: '10px'}} />
                <Bar dataKey="Consultation" stackId="a" fill="#0F4C81" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Pharmacy" stackId="a" fill="#00A896" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* P&L Summary */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-navy-900 mb-6">Today's P&L</h3>
          
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Consultation Income</span>
                <span className="font-medium text-navy-900">₹{metrics.consultationIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Pharmacy Sales</span>
                <span className="font-medium text-navy-900">₹{metrics.pharmacySales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-slate-100 pt-2 text-navy-900">
                <span>Total Income (A)</span>
                <span>₹{metrics.grossRevenue.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Medicine COGS</span>
                <span className="font-medium text-rose-600">-₹{metrics.medicineCOGS.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Daily Overheads (Est.)</span>
                <span className="font-medium text-rose-600">-₹{metrics.operatingOverheads.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-slate-100 pt-2 text-rose-600">
                <span>Total Expenses (B)</span>
                <span>₹{(metrics.medicineCOGS + metrics.operatingOverheads).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-navy-900">Net Profit (A - B)</span>
              <span className={`text-xl font-bold ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ₹{metrics.netProfit.toFixed(2)}
              </span>
            </div>
            <div className="text-right text-xs text-slate-500 mt-1">
              Margin: {metrics.profitMargin.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon, trend, bg }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
    <div className={`p-3 rounded-lg ${bg}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h4 className="text-2xl font-bold text-navy-900 mt-1">{value}</h4>
      <p className="text-xs font-medium text-slate-500 mt-1">{trend}</p>
    </div>
  </div>
);
