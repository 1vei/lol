'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Chat from '@/components/Chat'
import Browser from '@/components/Browser'
import Feed from '@/components/Feed'
import FileManager from '@/components/FileManager'
import Navigation from '@/components/Navigation'
import MusicPlayer from '@/components/MusicPlayer'
import ThemeToggle from '@/components/ThemeToggle'
import TimeDisplay from '@/components/TimeDisplay'
import PWAInstall from '@/components/PWAInstall'
import { registerServiceWorker, showNotification } from '@/lib/notifications'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [swipeStartX, setSwipeStartX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lastCounts, setLastCounts] = useState({
    chat: 0,
    feed: 0,
    browser: 0,
    files: 0,
  })

  const pages = [
    { name: 'Feed', component: Feed, slug: 'feed' },
    { name: 'Chat', component: Chat, slug: 'chat' },
    { name: 'Browser', component: Browser, slug: 'browser' },
    { name: 'Files', component: FileManager, slug: 'files' },
  ]

  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin') === 'true'
    setIsAdmin(adminStatus)
    
    registerServiceWorker()
    
    const tab = searchParams.get('tab')
    if (tab) {
      const pageIndex = pages.findIndex(p => p.slug === tab)
      if (pageIndex !== -1) {
        setCurrentPage(pageIndex)
      }
    }
    
    const interval = setInterval(checkForNewContent, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePageChange(currentPage - 1)
      } else if (e.key === 'ArrowRight') {
        handlePageChange(currentPage + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage])

  const checkForNewContent = async () => {
    try {
      const chatRes = await fetch('/api/chat/count')
      const { count: chatCount } = await chatRes.json()
      
      if (lastCounts.chat > 0 && chatCount > lastCounts.chat) {
        showNotification('New Chat Message', {
          body: `${chatCount - lastCounts.chat} new message(s)`,
          tag: 'chat',
          sound: '/notification.mp3',
        })
      }
      setLastCounts(prev => ({ ...prev, chat: chatCount }))

      const feedRes = await fetch('/api/feed/count')
      const { count: feedCount } = await feedRes.json()
      
      if (lastCounts.feed > 0 && feedCount > lastCounts.feed) {
        showNotification('New Feed Post', {
          body: 'New content in feed',
          tag: 'feed',
          sound: '/notification.mp3',
        })
      }
      setLastCounts(prev => ({ ...prev, feed: feedCount }))

      const browserRes = await fetch('/api/browser/count')
      const { count: browserCount } = await browserRes.json()
      
      if (lastCounts.browser > 0 && browserCount > lastCounts.browser) {
        showNotification('New Browser Link', {
          body: 'New link added',
          tag: 'browser',
          sound: '/notification.mp3',
        })
      }
      setLastCounts(prev => ({ ...prev, browser: browserCount }))

      const filesRes = await fetch('/api/files/count')
      const { count: filesCount } = await filesRes.json()
      
      if (lastCounts.files > 0 && filesCount > lastCounts.files) {
        showNotification('New File', {
          body: 'New file uploaded',
          tag: 'files',
          sound: '/notification.mp3',
        })
      }
      setLastCounts(prev => ({ ...prev, files: filesCount }))
    } catch (error) {
      console.error('Failed to check for new content:', error)
    }
  }

  const handlePageChange = (index: number) => {
    let newIndex = index
    if (index < 0) newIndex = pages.length - 1
    if (index >= pages.length) newIndex = 0
    setCurrentPage(newIndex)
    router.push(`/?tab=${pages[newIndex].slug}`, { scroll: false })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return
    const endX = e.changedTouches[0].clientX
    const diff = swipeStartX - endX
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handlePageChange(currentPage + 1)
      } else {
        handlePageChange(currentPage - 1)
      }
    }
    
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setSwipeStartX(e.clientX)
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    const diff = swipeStartX - e.clientX
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handlePageChange(currentPage + 1)
      } else {
        handlePageChange(currentPage - 1)
      }
    }
    
    setIsDragging(false)
  }

  const CurrentComponent = pages[currentPage].component

  return (
    <div
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <header className="app-header">
        <TimeDisplay />
        <MusicPlayer />
        <div className="header-actions">
          <PWAInstall />
          <ThemeToggle />
        </div>
      </header>

      <main className="app-main">
        <button
          className="nav-arrow nav-arrow-left"
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="Previous"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="page-content">
          <CurrentComponent isAdmin={isAdmin} />
        </div>

        <button
          className="nav-arrow nav-arrow-right"
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="Next"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </main>

      <PWAInstall />

      <style jsx>{`
        .app-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .app-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: calc(var(--spacing)) calc(var(--spacing) * 2);
          background: transparent;
          position: relative;
        }

        .app-header > :nth-child(1) {
          justify-self: start;
        }

        .app-header > :nth-child(2) {
          justify-self: center;
        }

        .app-header > :nth-child(3) {
          justify-self: end;
        }

        .header-actions {
          display: flex;
          gap: calc(var(--spacing));
        }

        .app-main {
          flex: 1;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: stretch;
        }

        .page-content {
          flex: 1;
          overflow: hidden;
        }

        .nav-arrow {
          width: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
        }

        .nav-arrow svg {
          width: 32px;
          height: 32px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-arrow:hover svg {
          transform: scale(1.2) rotate(5deg);
        }

        @media (max-width: 768px) {
          .app-header {
            padding: calc(var(--spacing) * 1.5);
            grid-template-columns: 1fr auto;
          }

          .app-header > :first-child {
            display: none;
          }

          .app-header > :nth-child(2) {
            justify-self: start;
          }

          .nav-arrow {
            display: none;
          }

          .page-content {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}
