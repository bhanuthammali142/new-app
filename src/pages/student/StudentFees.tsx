// @ts-nocheck
/**
 * StudentFees — Fixed: removed supabase, uses apiFees REST API
 */
import React, { useEffect, useState } from 'react'
import { Wallet, Clock, CheckCircle2, AlertCircle, FileDown, Loader2 } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { apiFees } from '../../lib/api-client'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

function fmt(n: number) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

export function StudentFees() {
  const { studentData } = useAuth()
  const [fees, setFees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentData?.id) return
    apiFees.getForStudent(studentData.id)
      .then((data: any[]) => setFees(data || []))
      .catch(err => toast.error('Failed to load fees'))
      .finally(() => setLoading(false))
  }, [studentData])

  const totalDue = fees.reduce((sum, f) => sum + Number(f.due_amount || 0), 0)

  const handlePayNow = () => {
    toast('Online payment not configured. Please pay at the hostel office.', {
      icon: '⚠️',
      duration: 5000,
    })
  }

  if (!studentData) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Wallet className="h-8 w-8 text-emerald-600" /> My Fees
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Track your due payments and view payment history.</p>
      </div>

      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Total Outstanding Due</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight">{loading ? '...' : fmt(totalDue)}</h2>
        </div>
        {totalDue > 0 && (
          <button
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95 w-full sm:w-auto"
            onClick={handlePayNow}
          >
            Pay Now
          </button>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Fee History</h3>
        {loading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-slate-400">
            <Loader2 className="animate-spin h-5 w-5" /> Loading...
          </div>
        ) : fees.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No fee records found yet.
          </div>
        ) : (
          <div className="space-y-3">
            {fees.map(fee => (
              <div
                key={fee.id}
                className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex gap-4 items-center">
                  <div className={cn(
                    'hidden sm:flex h-12 w-12 rounded-xl items-center justify-center border',
                    fee.status === 'paid'    ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                    fee.status === 'partial' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                    fee.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                              'bg-rose-50 border-rose-100 text-rose-600'
                  )}>
                    {fee.status === 'paid'    && <CheckCircle2 className="h-6 w-6" />}
                    {(fee.status === 'pending' || fee.status === 'partial') && <Clock className="h-6 w-6" />}
                    {fee.status === 'overdue' && <AlertCircle className="h-6 w-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg leading-tight">
                      {new Date(fee.month).toLocaleString('default', { month: 'long', year: 'numeric' })} Bill
                    </h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-slate-500 mt-1">
                      <span>Total: <strong className="text-slate-700">{fmt(Number(fee.amount))}</strong></span>
                      <span className="hidden sm:inline">•</span>
                      <span>Due: <strong className="text-rose-600">{fmt(Number(fee.due_amount))}</strong></span>
                      {fee.due_date && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>Due Date: {new Date(fee.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border',
                    fee.status === 'paid'    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    fee.status === 'partial' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    fee.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                              'bg-rose-50 text-rose-700 border-rose-200'
                  )}>
                    {fee.status}
                  </span>
                  {fee.status === 'paid' && fee.receipt_id && (
                    <button
                      onClick={() => toast.success(`Receipt ID: ${fee.receipt_id}`)}
                      className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      title="View Receipt"
                    >
                      <FileDown className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
