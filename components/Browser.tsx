'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Link {
  id: string
  url: string
  title: string
  image_url: string | null
  comment: string | null
  tags: string[]
  created_at: string
}

interface BrowserProps {
  isAdmin: boolean
}

export default function Browser({ isAdmin }: BrowserProps) {
  const [links, setLinks] = useState<Link[]>([])
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchLinks()
  }, [])

  useEffect(() => {
    if (selectedTag) {
      setFilteredLinks(links.filter(link => link.tags.includes(selectedTag)))
    } else {
      setFilteredLinks(links)
    }
  }, [selectedTag, links])

  const fetchLinks = async () => {
    const { data } = await supabase
      .from('browser_links')
      .select('id, url, title, image_url, comment, tags, created_at')
      .order('order_index', { ascending: true })
    
    if (data) {
      setLinks(data)
      const tags = new Set<string>()
      data.forEach(link => link.tags.forEach((tag: string) => tags.add(tag)))
      setAllTags(Array.from(tags))
    }
  }

  const fetchLinkTitle = async (url: string): Promise<string> => {
    try {
      const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      return data.title || url
    } catch {
      return url
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    
    const formData = new FormData(e.currentTarget)
    const url = formData.get('url') as string
    let title = formData.get('title') as string
    const imageFile = formData.get('image_file') as File
    const imageUrl = formData.get('image_url') as string
    const comment = formData.get('comment') as string
    const tags = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean)

    if (!title) {
      title = await fetchLinkTitle(url)
    }

    let finalImageUrl = imageUrl

    if (imageFile && imageFile.size > 0) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', imageFile)
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })
      
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        finalImageUrl = uploadData.url
      }
    }

    await fetch('/api/browser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        title,
        image_url: finalImageUrl,
        comment,
        tags,
      }),
    })
    
    setShowAddForm(false)
    setUploading(false)
    fetchLinks()
    e.currentTarget.reset()
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault()
    setUploading(true)
    
    const formData = new FormData(e.currentTarget)
    const url = formData.get('url') as string
    let title = formData.get('title') as string
    const imageFile = formData.get('image_file') as File
    const imageUrl = formData.get('image_url') as string
    const comment = formData.get('comment') as string
    const tags = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean)

    if (!title) {
      title = await fetchLinkTitle(url)
    }

    let finalImageUrl = imageUrl

    if (imageFile && imageFile.size > 0) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', imageFile)
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })
      
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        finalImageUrl = uploadData.url
      }
    }

    await fetch(`/api/browser/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        title,
        image_url: finalImageUrl,
        comment,
        tags,
      }),
    })
    
    setEditingId(null)
    setUploading(false)
    fetchLinks()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this link?')) return
    await fetch(`/api/browser/${id}`, { method: 'DELETE' })
    fetchLinks()
  }

  return (
    <div className="browser-container">
      {isAdmin && (
        <div className="browser-header">
          <button className="icon-btn" onClick={() => setShowAddForm(!showAddForm)} title={showAddForm ? 'Cancel' : 'Add Link'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showAddForm ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </>
              )}
            </svg>
          </button>
        </div>
      )}

      {showAddForm && isAdmin && (
        <div className="add-form card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <input className="input" name="url" placeholder="URL" required />
              </div>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <input className="input" name="title" placeholder="Title (auto-fetch if empty)" />
              </div>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <input className="input" type="file" name="image_file" accept="image/*" />
              </div>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <input className="input" name="image_url" placeholder="Or image URL" />
              </div>
              <div className="input-wrapper full-width">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <textarea className="input" name="comment" placeholder="Comment" rows={2} />
              </div>
              <div className="input-wrapper full-width">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <input className="input" name="tags" placeholder="Tags (comma-separated)" />
              </div>
            </div>
            <button className="icon-btn" type="submit" disabled={uploading} title="Add">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <div className="tags">
        <button
          className={`tag ${!selectedTag ? 'active' : ''}`}
          onClick={() => setSelectedTag(null)}
        >
          All
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            className={`tag ${selectedTag === tag ? 'active' : ''}`}
            onClick={() => setSelectedTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="links-grid">
        {filteredLinks.map(link => (
          <div key={link.id} className="link-card-wrapper">
            {editingId === link.id ? (
              <div className="edit-form card">
                <form onSubmit={(e) => handleEdit(e, link.id)}>
                  <div className="form-grid">
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <input className="input" name="url" defaultValue={link.url} required />
                    </div>
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <input className="input" name="title" defaultValue={link.title} />
                    </div>
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <input className="input" type="file" name="image_file" accept="image/*" />
                    </div>
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <input className="input" name="image_url" defaultValue={link.image_url || ''} placeholder="Or image URL" />
                    </div>
                    <div className="input-wrapper full-width">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <textarea className="input" name="comment" defaultValue={link.comment || ''} placeholder="Comment" rows={2} />
                    </div>
                    <div className="input-wrapper full-width">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      <input className="input" name="tags" defaultValue={link.tags.join(', ')} placeholder="Tags" />
                    </div>
                  </div>
                  <div className="edit-actions">
                    <button className="icon-btn" type="submit" disabled={uploading} title="Save">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button className="icon-btn" type="button" onClick={() => setEditingId(null)} title="Cancel">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-card"
                style={{
                  backgroundImage: link.image_url ? `url(${link.image_url})` : 'none',
                }}
              >
                <div className="link-overlay">
                  <h3>{link.title}</h3>
                  {link.comment && <p>{link.comment}</p>}
                </div>
                {isAdmin && (
                  <div className="card-actions">
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.preventDefault()
                        setEditingId(link.id)
                      }}
                      title="Edit"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(link.id)
                      }}
                      title="Delete"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </a>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .browser-container {
          height: 100%;
          overflow-y: auto;
          padding: calc(var(--spacing) * 2);
        }

        .browser-header {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: calc(var(--spacing) * 2);
        }

        .add-form,
        .edit-form {
          margin-bottom: calc(var(--spacing) * 3);
        }

        .add-form form,
        .edit-form form {
          display: flex;
          flex-direction: column;
          gap: calc(var(--spacing) * 2);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: calc(var(--spacing) * 1.5);
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .edit-actions {
          display: flex;
          gap: calc(var(--spacing));
          justify-content: center;
        }

        .add-form .icon-btn,
        .edit-form .icon-btn {
          align-self: center;
        }

        .tags {
          display: flex;
          gap: calc(var(--spacing));
          margin-bottom: calc(var(--spacing) * 3);
          overflow-x: auto;
          padding-bottom: calc(var(--spacing));
        }

        .tag {
          padding: calc(var(--spacing)) calc(var(--spacing) * 2);
          border-radius: calc(var(--radius) * 0.75);
          font-size: 9px;
          font-weight: 600;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          white-space: nowrap;
          transition: all 0.2s;
        }

        .tag:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .tag.active {
          background: var(--accent);
          color: white;
        }

        .links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: calc(var(--spacing) * 2);
        }

        .link-card-wrapper {
          position: relative;
        }

        .link-card {
          position: relative;
          height: 200px;
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--bg-secondary);
          background-size: cover;
          background-position: center;
          transition: transform 0.2s;
          display: block;
        }

        .link-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .link-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, oklch(0% 0 0 / 0.8), transparent);
          padding: calc(var(--spacing) * 2);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          color: white;
        }

        .link-overlay h3 {
          font-size: 36px;
          font-weight: 900;
          margin-bottom: calc(var(--spacing));
          letter-spacing: -1px;
        }

        .link-overlay p {
          font-size: 10px;
          opacity: 0.9;
          font-weight: 400;
        }

        .card-actions {
          position: absolute;
          top: calc(var(--spacing));
          right: calc(var(--spacing));
          display: flex;
          gap: calc(var(--spacing) * 0.5);
        }

        .action-btn {
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
          .browser-container {
            padding: var(--spacing);
          }

          .links-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .browser-header {
            margin-bottom: calc(var(--spacing) * 2);
          }
        }
      `}</style>
    </div>
  )
}
