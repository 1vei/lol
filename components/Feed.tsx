'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Masonry from 'react-masonry-css'

interface FeedItem {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnail_url: string | null
  created_at: string
}

interface FeedProps {
  isAdmin: boolean
}

export default function Feed({ isAdmin }: FeedProps) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const { data } = await supabase
      .from('feed_items')
      .select('id, type, url, thumbnail_url, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (data) setItems(data)
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setUploading(true)

    const formData = new FormData(form)
    const file = formData.get('file') as File
    const url = formData.get('url') as string

    if (!file && !url) {
      alert('Please select a file or enter a URL')
      setUploading(false)
      return
    }

    try {
      if (url) {
        const res = await fetch('/api/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })

        if (res.ok) {
          setShowUploadForm(false)
          await fetchItems()
          form.reset()
        }
      } else {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        const res = await fetch('/api/feed', {
          method: 'POST',
          body: uploadFormData,
        })

        if (res.ok) {
          setShowUploadForm(false)
          await fetchItems()
          form.reset()
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    
    await fetch(`/api/feed/${id}`, { method: 'DELETE' })
    fetchItems()
  }

  const breakpointColumns = {
    default: 4,
    1400: 3,
    1000: 2,
    600: 1,
  }

  return (
    <div className="feed-container">
      {isAdmin && (
        <div className="feed-header">
          <button className="icon-btn" onClick={() => setShowUploadForm(!showUploadForm)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showUploadForm ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </>
              )}
            </svg>
          </button>
        </div>
      )}

      {showUploadForm && isAdmin && (
        <div className="upload-form">
          <form onSubmit={handleUpload}>
            <div className="form-row">
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                <input
                  className="input"
                  type="file"
                  name="file"
                  accept="image/*,video/*"
                />
              </div>
              <span className="divider">OR</span>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <input className="input" name="url" placeholder="Image/Video URL" />
              </div>
              <button className="icon-btn" type="submit" disabled={uploading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-column"
      >
        {items.map((item) => (
          <div key={item.id} className="feed-item">
            {item.type === 'image' ? (
              <img src={item.url} alt="" />
            ) : (
              <video src={item.url} controls />
            )}
            {isAdmin && (
              <button className="action-btn delete" onClick={() => handleDelete(item.id)} title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </Masonry>

      <style jsx>{`
        .feed-container {
          height: 100%;
          overflow-y: auto;
          padding: 0;
        }

        .feed-header {
          display: flex;
          justify-content: center;
          padding: calc(var(--spacing) * 2);
        }

        .upload-form {
          padding: 0 calc(var(--spacing) * 2) calc(var(--spacing) * 2);
        }

        .form-row {
          display: flex;
          gap: calc(var(--spacing));
          align-items: center;
          flex-wrap: wrap;
        }

        .form-row > .input-wrapper {
          flex: 1;
          min-width: 200px;
        }

        .divider {
          color: var(--text-tertiary);
          font-size: 12px;
          font-weight: 600;
        }

        :global(.masonry-grid) {
          display: flex;
          margin-left: 0;
          width: 100%;
          gap: 0;
        }

        :global(.masonry-column) {
          padding-left: 0;
          background-clip: padding-box;
        }

        .feed-item {
          position: relative;
          margin-bottom: 0;
          border-radius: 0;
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .feed-item img,
        .feed-item video {
          width: 100%;
          display: block;
        }

        .action-btn {
          position: absolute;
          top: calc(var(--spacing));
          right: calc(var(--spacing));
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: calc(var(--radius) * 0.75);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--text-secondary);
        }

        .action-btn svg {
          width: 24px;
          height: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-btn:hover svg {
          transform: scale(1.2) rotate(5deg);
        }

        .action-btn:active svg {
          transform: scale(0.95) rotate(-5deg);
        }

        @media (max-width: 768px) {
          .feed-header {
            padding: var(--spacing);
          }

          .upload-form {
            padding: 0 var(--spacing) var(--spacing);
          }

          .form-row {
            flex-direction: column;
          }

          .form-row > .input-wrapper {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
