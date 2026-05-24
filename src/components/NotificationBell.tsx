// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { apiNotifications } from '../lib/api-client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // 1. Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ['notification-count'],
    queryFn: () => apiNotifications.getUnreadCount(),
    refetchInterval: 30000,
    enabled: !!user,
  })

  // 2. Fetch all notifications (only when open)
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiNotifications.getAll(),
    enabled: isOpen && !!user,
  })

  const unreadCount = countData?.data?.count || 0
  const notifications = notificationsData?.data || []

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Refetch when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      refetchNotifications()
    }
  }, [isOpen, refetchNotifications])

  const handleMarkAllAsRead = async () => {
    try {
      await apiNotifications.markAllAsRead()
      queryClient.invalidateQueries({ queryKey: ['notification-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark notifications as read')
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiNotifications.markAsRead(id)
      queryClient.invalidateQueries({ queryKey: ['notification-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch (err: any) {
      console.error(err)
    }
  }

  // Get emoji based on notification type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment_received':
        return '💰'
      case 'reward_redeemed':
        return '🎁'
      case 'fee_reminder':
        return '⏰'
      case 'announcement':
        return '📢'
      default:
        return '🔔'
    }
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col max-h-[480px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <span className="font-semibold text-slate-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold focus:outline-none"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) handleMarkAsRead(notif.id)
                    }}
                    className={`flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      notif.is_read ? 'bg-white' : 'bg-blue-50/50'
                    }`}
                  >
                    <span className="text-xl shrink-0 leading-none">
                      {getTypeIcon(notif.type)}
                    </span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className={`text-xs text-slate-700 leading-normal ${!notif.is_read ? 'font-medium' : ''}`}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {notif.created_at
                          ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })
                          : 'just now'}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
