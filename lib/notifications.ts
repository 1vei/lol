'use client'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

export async function showNotification(
  title: string,
  options?: {
    body?: string
    icon?: string
    tag?: string
    silent?: boolean
    sound?: string
  }
) {
  if (!isNotificationSupported()) return

  const permission = await requestNotificationPermission()
  if (!permission) return

  const notificationOptions: NotificationOptions = {
    body: options?.body,
    icon: options?.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: options?.tag,
    silent: options?.silent || false,
    requireInteraction: false,
  }

  const notification = new Notification(title, notificationOptions)

  if (options?.sound && !options?.silent) {
    try {
      const audio = new Audio(options.sound)
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200])
  }

  notification.onclick = () => {
    window.focus()
    notification.close()
  }

  setTimeout(() => {
    notification.close()
  }, 5000)
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration)
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
  }
}

export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update()
    })
  }
}
