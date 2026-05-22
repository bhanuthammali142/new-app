import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, CheckCircle2, AlertCircle, Users, Calendar, ArrowRight } from 'lucide-react';
import { apiBilling } from '../../lib/api-client';
import { Skeleton } from '../../components/Skeleton';
import { AnimateView } from '../../components/AnimateView';
import toast from 'react-hot-toast';

export function Billing() {
  const [isProcessing, setIsProcessing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const res = await apiBilling.getMySubscription();
      return res.data;
    }
  });

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const res = await apiBilling.subscribe(data.plan_id);
      
      const options = {
        key: res.data.key_id,
        amount: res.data.amount,
        currency: res.data.currency,
        name: 'HostelOS',
        description: `Subscription: ${data.plan_name}`,
        order_id: res.data.order_id,
        handler: async function (response: any) {
          try {
            await apiBilling.verify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: data.plan_id
            });
            toast.success('Subscription activated successfully!');
            refetch();
          } catch (error: any) {
            toast.error(error.message || 'Payment verification failed');
          }
        },
        theme: {
          color: '#4f46e5'
        }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const sub = data;
  const isPastDue = sub.status === 'past_due' || sub.status === 'canceled';
  const isActive = sub.status === 'active' || sub.status === 'trialing';

  return (
    <AnimateView className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Billing & Subscription</h1>
        <p className="text-slate-500 mt-1">Manage your platform plan, view invoices, and upgrade capacity.</p>
      </div>

      {isPastDue && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold">Subscription Past Due</h3>
            <p className="text-sm mt-1 text-red-600">Your recent payment failed or your subscription was canceled. Please update your payment method to restore full access to add new students and rooms.</p>
          </div>
        </div>
      )}

      {sub.is_capacity_reached && isActive && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold">Capacity Limit Reached</h3>
            <p className="text-sm mt-1 text-amber-600">You have reached the maximum number of students ({sub.max_students}) allowed on your current plan. Please upgrade your plan to admit more students.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                <AlertCircle className="h-3.5 w-3.5" /> {sub.status === 'past_due' ? 'Past Due' : 'Canceled'}
              </span>
            )}
          </div>

          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Current Plan</h2>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-black text-slate-900">₹{sub.price}</span>
            <span className="text-slate-500 font-medium">/ month</span>
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-6">{sub.plan_name}</h3>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Users className="h-4 w-4 text-indigo-500" /> Students Usage
              </div>
              <span className="font-bold text-slate-900">{sub.student_count} / {sub.max_students}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${sub.is_capacity_reached ? 'bg-red-500' : 'bg-indigo-500'}`}
                style={{ width: \`\${Math.min((sub.student_count / sub.max_students) * 100, 100)}%\` }}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium pt-2">
              <Calendar className="h-4 w-4 text-emerald-500" />
              {sub.current_period_end ? (
                <>Next billing date: <span className="text-slate-900 font-bold">{new Date(sub.current_period_end).toLocaleDateString()}</span></>
              ) : (
                'Trial active'
              )}
            </div>
          </div>

          {sub.status === 'trialing' || isPastDue ? (
            <button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
            >
              <CreditCard className="h-5 w-5" />
              {isProcessing ? 'Processing...' : 'Subscribe Now'}
            </button>
          ) : (
            <button
              onClick={() => toast('Subscription management coming soon')}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-3 px-4 rounded-xl transition"
            >
              Manage Billing Details <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Feature List */}
        <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col justify-center">
          <h3 className="text-xl font-bold mb-6 text-slate-100">Everything you need to run your hostel</h3>
          <ul className="space-y-4">
            {[
              'Add up to 200 active students',
              'Unlimited rooms & beds management',
              'Automated fee generation & Razorpay collection',
              'Interactive complaint resolution',
              'Food menu scheduling & attendance',
              'Multi-tenant isolated database security'
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300 font-medium">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AnimateView>
  );
}
