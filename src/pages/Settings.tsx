// src/pages/Settings.tsx
import React, { useEffect, useState, lazy, Suspense } from 'react'
import { Building, Shield, Bell, CreditCard, User, LogOut, Save, Loader2, UtensilsCrossed, Key, ShieldCheck, Sparkles, Receipt } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/AuthContext'
import { getOrCreateHostel, updateHostel, updateProfile } from '../lib/api'
import { apiAuth } from '../lib/api-client'
import type { Hostel } from '../types'
import toast from 'react-hot-toast'

const FoodMenuEditor = lazy(() => import('./FoodMenuEditor').then(m => ({ default: m.FoodMenuEditor })))

type Tab = 'Hostel Details' | 'Food Menu' | 'Profile' | 'Notifications' | 'Security' | 'Billing'

export function Settings() {
  const { user, signOut, setUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('Hostel Details')
  const [hostel, setHostel] = useState<Hostel | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Hostel details form state
  const [hostelForm, setHostelForm] = useState({
    name: '',
    address: '',
    contact_phone: '',
    contact_email: '',
  })

  // User profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
  })

  // Password update form state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  // Notifications form state
  const [notifPreferences, setNotifPreferences] = useState({
    emailComplaints: true,
    smsOverdueFees: true,
    emailDailyAttendance: false,
    pushRewards: true,
  })

  useEffect(() => {
    if (!user) return
    
    // Set Profile form from current user context
    setProfileForm({
      name: user.name ?? '',
      phone: user.phone ?? '',
      email: user.email ?? '',
    })

    // Fetch Hostel details
    getOrCreateHostel(String(user.id)).then(h => {
      if (h) {
        setHostel(h)
        setHostelForm({
          name: h.name ?? '',
          address: h.address ?? '',
          contact_phone: h.contact_phone ?? '',
          contact_email: h.contact_email ?? user.email ?? '',
        })
      }
    })
  }, [user])

  const handleSaveHostel = async () => {
    if (!hostel) return
    setSaving(true)
    try {
      await updateHostel(hostel.id, {
        name: hostelForm.name,
        address: hostelForm.address,
        contact_phone: hostelForm.contact_phone,
      })
      toast.success('Hostel details saved!')
    } catch {
      toast.error('Failed to save hostel details.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile(profileForm.name, profileForm.phone, profileForm.email)
      
      // Update local auth context immediately
      if (user) {
        setUser({
          ...user,
          name: profileForm.name,
          phone: profileForm.phone,
          email: profileForm.email,
        })
      }
      
      toast.success('User profile updated successfully!')
    } catch (err: any) {
      console.error('Profile update error:', err)
      toast.error(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePassword = async () => {
    if (!passwordForm.newPassword) {
      toast.error('Password cannot be empty')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      await apiAuth.changePassword(passwordForm.newPassword)
      toast.success('Password updated successfully!')
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      console.error('Password update error:', err)
      toast.error(err.message || 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = () => {
    setSaving(true)
    // Simulate API delay
    setTimeout(() => {
      setSaving(false)
      toast.success('Notification preferences updated!')
    }, 500)
  }

  const tabs: { icon: React.ElementType; label: Tab }[] = [
    { icon: Building, label: 'Hostel Details' },
    { icon: UtensilsCrossed, label: 'Food Menu' },
    { icon: User, label: 'Profile' },
    { icon: Bell, label: 'Notifications' },
    { icon: Shield, label: 'Security' },
    { icon: CreditCard, label: 'Billing' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 flex items-center gap-2">
          Settings
        </h1>
        <p className="text-slate-500 mt-1">Configure your hostel preferences, account info, and security details.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mt-8">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          {tabs.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setActiveTab(label)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left border border-transparent',
                activeTab === label
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100/50 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('h-4 w-4', activeTab === label ? 'text-indigo-600' : 'text-slate-400')} />
              {label}
            </button>
          ))}
          <div className="h-px bg-slate-200/60 my-3 mx-2" />
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all text-left"
          >
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </div>

        {/* Form panel container */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 sm:p-8 flex-1">
            
            {/* TABS IMPLEMENTATION */}
            
            {/* 1. Hostel Details */}
            {activeTab === 'Hostel Details' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900">Hostel Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Update public metadata, contact information, and address for this hostel.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Hostel Name</label>
                      <input
                        type="text"
                        value={hostelForm.name}
                        onChange={e => setHostelForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Contact Number</label>
                      <input
                        type="text"
                        value={hostelForm.contact_phone}
                        onChange={e => setHostelForm(p => ({ ...p, contact_phone: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Address</label>
                    <textarea
                      rows={3}
                      value={hostelForm.address}
                      onChange={e => setHostelForm(p => ({ ...p, address: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none transition"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Registered Email (Read Only)</label>
                    <input
                      type="email"
                      value={hostelForm.contact_email}
                      disabled
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400">Hostel contact email is linked to the primary administrator login credentials.</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handleSaveHostel}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center gap-2 min-w-[130px] justify-center shadow-lg shadow-indigo-600/15 disabled:opacity-50"
                    >
                      {saving ? (
                        <><Loader2 className="animate-spin h-4 w-4" />Saving...</>
                      ) : (
                        <><Save className="h-4 w-4" />Save Details</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Food Menu */}
            {activeTab === 'Food Menu' && (
              <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-slate-400" /></div>}>
                <FoodMenuEditor />
              </Suspense>
            )}

            {/* 3. User Profile */}
            {activeTab === 'Profile' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900">User Profile</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your personal admin account credentials and contact phone.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg flex items-center justify-center uppercase shrink-0">
                      {profileForm.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{profileForm.name || 'Administrator'}</h4>
                      <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role?.replace('_', ' ') || 'Admin'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Contact Phone</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Admin Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center gap-2 min-w-[130px] justify-center shadow-lg shadow-indigo-600/15 disabled:opacity-50"
                    >
                      {saving ? (
                        <><Loader2 className="animate-spin h-4 w-4" />Saving...</>
                      ) : (
                        <><Save className="h-4 w-4" />Save Profile</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Notifications */}
            {activeTab === 'Notifications' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900">Notifications</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Control how and when you receive automated emails and SMS notifications.</p>
                </div>
                
                <div className="space-y-5">
                  {[
                    {
                      id: 'emailComplaints',
                      title: 'Complaint Email Alerts',
                      desc: 'Send an email update instantly whenever a student files a new complaint.',
                      value: notifPreferences.emailComplaints,
                    },
                    {
                      id: 'smsOverdueFees',
                      title: 'SMS Payment Reminders',
                      desc: 'Send automated SMS to students when their monthly fee balance becomes overdue.',
                      value: notifPreferences.smsOverdueFees,
                    },
                    {
                      id: 'emailDailyAttendance',
                      title: 'Daily Attendance Report',
                      desc: 'Receive an automated email summary at 10 PM daily containing today\'s absent list.',
                      value: notifPreferences.emailDailyAttendance,
                    },
                    {
                      id: 'pushRewards',
                      title: 'Rewards Updates',
                      desc: 'Get alerted when student points are updated or new leaderboard rankings roll out.',
                      value: notifPreferences.pushRewards,
                    },
                  ].map((pref) => (
                    <div key={pref.id} className="flex justify-between items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition duration-200">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-sm">{pref.title}</h4>
                        <p className="text-xs text-slate-500 max-w-lg">{pref.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifPreferences(p => ({ ...p, [pref.id]: !p[pref.id as keyof typeof notifPreferences] }))}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors relative shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                          pref.value ? 'bg-indigo-600' : 'bg-slate-200'
                        )}
                      >
                        <span className={cn(
                          "absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm",
                          pref.value ? 'translate-x-5' : 'translate-x-0'
                        )} />
                      </button>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center gap-2 min-w-[130px] justify-center shadow-lg shadow-indigo-600/15 disabled:opacity-50"
                    >
                      {saving ? (
                        <><Loader2 className="animate-spin h-4 w-4" />Saving...</>
                      ) : (
                        <><Save className="h-4 w-4" />Save Preferences</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Security */}
            {activeTab === 'Security' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900">Security & Credentials</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Reset your password or enable enhanced security options.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">New Password</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Confirm New Password</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handleSavePassword}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center gap-2 min-w-[130px] justify-center shadow-lg shadow-indigo-600/15 disabled:opacity-50"
                    >
                      {saving ? (
                        <><Loader2 className="animate-spin h-4 w-4" />Updating...</>
                      ) : (
                        <><Key className="h-4 w-4" />Update Password</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Billing */}
            {activeTab === 'Billing' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900">Subscription & Billing</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Check plan information, billing cycle, and invoice history details.</p>
                </div>
                
                <div className="space-y-6">
                  {/* Premium subscription card */}
                  <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-6 relative overflow-hidden shadow-xl border border-indigo-900/50">
                    <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                      <Building className="h-40 w-40" />
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-400/20 flex items-center gap-1 w-max">
                          <Sparkles className="h-3 w-3" /> PREMIUM ACCOUNT
                        </span>
                        <h3 className="text-2xl font-black tracking-tight">{hostelForm.name || 'Elite Hostel'}</h3>
                        <p className="text-xs text-indigo-200">Billed monthly · Next renewal on June 20, 2026</p>
                      </div>
                      <span className="text-2xl font-black tracking-tight">$49<span className="text-xs font-normal text-indigo-300">/mo</span></span>
                    </div>
                    
                    <div className="h-px bg-indigo-500/20 my-5" />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-indigo-400" />
                        <span className="text-indigo-200 font-medium">Automatic payments enabled via Mastercard ending in 8890</span>
                      </div>
                      <button className="text-indigo-300 font-bold hover:text-white transition">Update Card</button>
                    </div>
                  </div>

                  {/* Plan details */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-indigo-600" /> Plan Features & Limits
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Hostel Rooms', limit: 'Unlimited Allocation', status: 'Active' },
                        { label: 'Student Admissions', limit: 'Up to 500 Active', status: '34 Admits' },
                        { label: 'Cloud Storage', limit: '5 GB Aadhaar Photos', status: '0.4 GB Used' },
                      ].map((feat) => (
                        <div key={feat.label} className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50">
                          <p className="text-xs font-bold text-slate-500 uppercase">{feat.label}</p>
                          <p className="font-bold text-slate-800 mt-1 text-sm">{feat.limit}</p>
                          <span className="inline-block mt-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {feat.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
