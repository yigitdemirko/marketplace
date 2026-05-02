import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { notificationsApi, type Notification } from '@/api/notifications'

function formatRelativeTime(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'şimdi'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.floor(hours / 24)
  return `${days} gün önce`
}

export function NotificationBell() {
  const items = useNotificationStore((s) => s.items)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const markReadLocal = useNotificationStore((s) => s.markRead)
  const markAllReadLocal = useNotificationStore((s) => s.markAllRead)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleItemClick = (n: Notification) => {
    if (!n.read) {
      markReadLocal(n.id)
      notificationsApi.markRead(n.id).catch(() => {})
    }
    setOpen(false)
  }

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return
    markAllReadLocal()
    notificationsApi.markAllRead().catch(() => {})
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex flex-col items-center gap-0.5 cursor-pointer"
        aria-label="Bildirimler"
      >
        <div className="relative">
          <Bell className="h-6 w-6 text-[#6f7c8e]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#fa3434] text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#6f7c8e]">Bildirim</span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[360px] max-h-[480px] bg-white border border-[#dce0e5] rounded-[8px] shadow-lg z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#dce0e5]">
            <span className="font-semibold text-[14px] text-[#14181f]">Bildirimler</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[12px] text-[#3348ff] hover:underline cursor-pointer"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-[#6f7c8e]">
                Henüz bildirim yok
              </div>
            ) : (
              items.map((n) => {
                const content = (
                  <>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] ${n.read ? 'text-[#6f7c8e]' : 'text-[#14181f] font-semibold'}`}>
                          {n.title}
                        </p>
                        <p className="text-[12px] text-[#6f7c8e] mt-0.5 truncate">{n.body}</p>
                        <p className="text-[11px] text-[#b6c1ca] mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#3348ff] mt-1.5 shrink-0" />}
                    </div>
                  </>
                )
                const className = `block w-full text-left px-4 py-3 border-b border-[#f0f2f5] last:border-b-0 hover:bg-[#f7f8f9] transition-colors ${!n.read ? 'bg-[#f7f9ff]' : ''}`
                return n.link ? (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={() => handleItemClick(n)}
                    className={className}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={className}
                  >
                    {content}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
