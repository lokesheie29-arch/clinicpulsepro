import React, { useState } from 'react';
import { 
  FlaskConical, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Terminal, 
  RotateCcw, 
  Sparkles,
  RefreshCw,
  Key
} from 'lucide-react';
import { usePayment } from '../../context/PaymentContext';
import { useAppState } from '../../context/AppStateContext';

export const SandboxTestingSuite: React.FC = () => {
  const { invoices } = useAppState();
  const { activeConfig, simulateWebhookArrival, recordFailedPayment, resetPaymentData } = usePayment();

  // Test Webhook form
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    invoices.find(i => i.paymentStatus === 'Pending')?.id || invoices[0]?.id || ''
  );
  const [eventType, setEventType] = useState<'payment.captured' | 'payment.failed'>('payment.captured');
  const [testMethod, setTestMethod] = useState<'PhonePe' | 'Google Pay' | 'Paytm' | 'Card'>('PhonePe');
  const [failureReason, setFailureReason] = useState<string>('INSUFFICIENT_FUNDS');

  const [isDispatching, setIsDispatching] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    `[INIT] Sandbox Webhook & Cryptographic Verification Engine initialized`,
    `[INFO] Target Environment: ${activeConfig.environmentMode.toUpperCase()}`,
    `[INFO] Active Webhook Secret: ${activeConfig.webhookSecret.substring(0, 8)}••••••••`
  ]);

  const targetInvoice = invoices.find(i => i.id === selectedInvoiceId) || invoices[0];

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 20)]);
  };

  // Dispatch Test Webhook
  const handleDispatchWebhook = async () => {
    if (!targetInvoice) return;
    setIsDispatching(true);

    addLog(`Dispatching simulated webhook event: '${eventType}' for ${targetInvoice.id}...`);
    addLog(`Computing cryptographic HMAC-SHA256 signature with secret '${activeConfig.webhookSecret.substring(0, 6)}...'`);

    try {
      await new Promise(r => setTimeout(r, 600));

      if (eventType === 'payment.captured') {
        const txn = await simulateWebhookArrival(
          'payment.captured',
          targetInvoice.id,
          targetInvoice.totalAmount,
          targetInvoice.patient.name,
          targetInvoice.patient.phone,
          testMethod === 'Card' ? 'card' : 'upi_intent'
        );

        addLog(`✓ HMAC-SHA256 Signature MATCHED (Status: 200 OK)`);
        addLog(`✓ Invoice #${targetInvoice.id} payment status automatically updated to 'Paid'`);
        addLog(`✓ Transaction recorded: ${txn.id} (Net Settled: ₹${txn.netSettlementAmount.toFixed(2)})`);
      } else {
        const reasons: { [k: string]: string } = {
          'INSUFFICIENT_FUNDS': 'PAYMENT_DECLINED: Customer account has insufficient funds',
          'UPI_LIMIT_EXCEEDED': 'PAYMENT_DECLINED: Daily UPI transaction volume limit reached',
          'PIN_TIMEOUT': 'PAYMENT_TIMED_OUT: Customer failed to enter UPI MPIN within 300 seconds',
          'USER_CANCELLED': 'PAYMENT_CANCELLED: Patient cancelled the transaction on payment app'
        };

        const reasonText = reasons[failureReason] || 'PAYMENT_DECLINED_BY_BANK';
        const txn = recordFailedPayment(
          `order_test_${Date.now()}`,
          targetInvoice.id,
          targetInvoice.totalAmount,
          targetInvoice.patient.name,
          targetInvoice.patient.phone,
          testMethod === 'Card' ? 'card' : 'upi_intent',
          reasonText
        );

        addLog(`⚠️ Webhook event processed: '${eventType}'`);
        addLog(`⚠️ Reason: ${reasonText}`);
        addLog(`⚠️ Transaction recorded as FAILED: ${txn.id}`);
      }
    } catch (e: any) {
      addLog(`[ERROR] Webhook dispatch failed: ${e.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo payment transactions to initial state?')) {
      resetPaymentData();
      addLog('[RESET] Demo payment transactions restored to initial seed dataset.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Sandbox Alert Header */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-amber-900 flex items-start gap-3.5">
        <FlaskConical className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-amber-950">Gateway Sandbox & Webhook Simulation Suite</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
              NON-PRODUCTION ENVIRONMENT
            </span>
          </div>
          <p className="text-xs text-amber-800/90">
            Test end-to-end payment confirmation callbacks, signature verification, automatic bill status transitions, and bank decline edge cases without charging real money.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Webhook Simulator Controls */}
        <div className="md:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Send className="w-4 h-4 text-teal-600" />
            <h4 className="font-bold text-navy-900 text-sm">Simulate Gateway Webhook Event</h4>
          </div>

          {/* Target Invoice */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Invoice to Test:
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.id} — {inv.patient.name} (₹{inv.totalAmount.toFixed(2)}) [{inv.paymentStatus}]
                </option>
              ))}
            </select>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Webhook Event Type:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEventType('payment.captured')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  eventType === 'payment.captured'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>payment.captured</span>
              </button>

              <button
                type="button"
                onClick={() => setEventType('payment.failed')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  eventType === 'payment.failed'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>payment.failed</span>
              </button>
            </div>
          </div>

          {/* Payment Method / App */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Payment Instrument:
            </label>
            <select
              value={testMethod}
              onChange={(e) => setTestMethod(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
            >
              <option value="PhonePe">PhonePe UPI</option>
              <option value="Google Pay">Google Pay UPI</option>
              <option value="Paytm">Paytm UPI</option>
              <option value="Card">Visa / MasterCard Debit Card</option>
            </select>
          </div>

          {/* Failure reason if failure event */}
          {eventType === 'payment.failed' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Decline Reason:
              </label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
              >
                <option value="INSUFFICIENT_FUNDS">Insufficient Funds in Account</option>
                <option value="UPI_LIMIT_EXCEEDED">Daily UPI Volume Limit Exceeded</option>
                <option value="PIN_TIMEOUT">Customer MPIN Timeout (300s)</option>
                <option value="USER_CANCELLED">Customer Cancelled on App</option>
              </select>
            </div>
          )}

          {/* Dispatch Button */}
          <button
            type="button"
            disabled={isDispatching || !targetInvoice}
            onClick={handleDispatchWebhook}
            className="w-full bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isDispatching ? 'animate-spin' : ''}`} />
            <span>{isDispatching ? 'Validating Signature & Executing...' : 'Dispatch Webhook & Reconcile Bill'}</span>
          </button>
        </div>

        {/* Right Column: Console Output & Signature Verification */}
        <div className="md:col-span-6 bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between font-mono text-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-slate-200">Webhook Audit Console</span>
              </div>
              <span className="text-[10px] text-teal-400 font-semibold bg-teal-950/60 border border-teal-800 px-2 py-0.5 rounded">
                HMAC-SHA256 Active
              </span>
            </div>

            {/* Terminal Logs */}
            <div className="mt-3 space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {logs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`leading-relaxed text-[11px] ${
                    log.includes('✓') ? 'text-emerald-400' :
                    log.includes('⚠️') ? 'text-amber-400' :
                    log.includes('[ERROR]') ? 'text-rose-400' :
                    'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Payload Signature: Valid</span>
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Sandbox Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
