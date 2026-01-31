'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  parent_id: string | null
  file_url: string | null
  icon_url: string | null
  mime_type: string | null
  size: number | null
  created_at: string
}

interface FileManagerProps {
  isAdmin: boolean
}

export default function FileManager({ isAdmin }: FileManagerProps) {
  const [items, setItems] = useState<FileItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Root' },
  ])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const folderFormRef = useRef<HTMLFormElement>(null)
  const uploadFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    fetchItems()
  }, [currentFolder])

  const fetchItems = async () => {
    const query = supabase
      .from('file_manager')
      .select('id, name, type, parent_id, file_url, icon_url, mime_type, size, created_at')
      .order('type', { ascending: false })
      .order('name', { ascending: true })

    if (currentFolder) {
      query.eq('parent_id', currentFolder)
    } else {
      query.is('parent_id', null)
    }

    const { data } = await query
    if (data) {
      // Separate folders and files, then combine
      const folders = data.filter(item => item.type === 'folder')
      const files = data.filter(item => item.type === 'file')
      setItems([...folders, ...files])
    }
  }

  const handleFolderClick = async (folder: FileItem) => {
    setCurrentFolder(folder.id)
    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }])
  }

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(newBreadcrumbs)
    setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1].id)
  }

  const handleCreateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type: 'folder',
        parent_id: currentFolder,
      }),
    })

    setShowFolderForm(false)
    setUploading(false)
    fetchItems()
    if (folderFormRef.current) {
      folderFormRef.current.reset()
    }
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File
    const iconFile = formData.get('icon_file') as File
    const iconUrl = formData.get('icon_url') as string

    if (!file) {
      alert('Please select a file')
      setUploading(false)
      return
    }

    let finalIconUrl = iconUrl

    if (iconFile && iconFile.size > 0) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', iconFile)
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })
      
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        finalIconUrl = uploadData.url
      }
    }

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('parent_id', currentFolder || '')
    if (finalIconUrl) uploadFormData.append('icon_url', finalIconUrl)

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (res.ok) {
        setShowUploadForm(false)
        fetchItems()
        if (uploadFormRef.current) {
          uploadFormRef.current.reset()
        }
      } else {
        alert('Upload failed')
      }
    } catch (error) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    
    await fetch(`/api/files/${id}`, { method: 'DELETE' })
    fetchItems()
  }

  const getFileIcon = (item: FileItem) => {
    if (item.type === 'folder') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    }

    if (item.icon_url) {
      return <img src={item.icon_url} alt="" className="custom-icon" />
    }

    if (item.mime_type?.startsWith('image/')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )
    }

    if (item.mime_type?.startsWith('video/')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      )
    }

    if (item.mime_type?.startsWith('audio/')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      )
    }

    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
      </svg>
    )
  }

  return (
    <div className="file-manager-container">
      {isAdmin && (
        <div className="file-manager-header">
          <button className="icon-btn" onClick={() => setShowFolderForm(!showFolderForm)} title={showFolderForm ? 'Cancel' : 'New Folder'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showFolderForm ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              )}
            </svg>
          </button>
          <button className="icon-btn" onClick={() => setShowUploadForm(!showUploadForm)} title={showUploadForm ? 'Cancel' : 'Upload'}>
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

      <div className="breadcrumbs">
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="breadcrumb-item">
            <button
              className="breadcrumb"
              onClick={() => handleBreadcrumbClick(index)}
            >
              {crumb.name}
            </button>
            {index < breadcrumbs.length - 1 && <span className="separator">/</span>}
          </span>
        ))}
      </div>

      {showFolderForm && isAdmin && (
        <div className="form-card card">
          <form ref={folderFormRef} onSubmit={handleCreateFolder}>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <input className="input" name="name" placeholder="Folder name" required />
            </div>
            <button className="icon-btn" type="submit" disabled={uploading} title="Create">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {showUploadForm && isAdmin && (
        <div className="form-card card">
          <form ref={uploadFormRef} onSubmit={handleUpload}>
            <div className="form-grid">
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                <input className="input" type="file" name="file" required />
              </div>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <input className="input" type="file" name="icon_file" accept="image/*,.gif" />
              </div>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <input className="input" name="icon_url" placeholder="Or icon URL" />
              </div>
            </div>
            <button className="icon-btn" type="submit" disabled={uploading} title={uploading ? 'Uploading...' : 'Upload'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <div className="files-grid">
        {items.map((item) => (
          <div key={item.id} className="file-item">
            {item.type === 'folder' ? (
              <button className="file-content" onClick={() => handleFolderClick(item)}>
                <div className="icon-wrapper">{getFileIcon(item)}</div>
                <span className="name">{item.name}</span>
              </button>
            ) : (
              <a
                className="file-content"
                href={item.file_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="icon-wrapper">{getFileIcon(item)}</div>
                <span className="name">{item.name}</span>
              </a>
            )}
            {isAdmin && (
              <button className="delete-btn" onClick={() => handleDelete(item.id)} title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .file-manager-container {
          height: 100%;
          overflow-y: auto;
          padding: calc(var(--spacing) * 2);
          background: var(--bg-primary);
        }

        .file-manager-header {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: calc(var(--spacing) * 2);
          margin-bottom: calc(var(--spacing) * 2);
        }

        .breadcrumbs {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: calc(var(--spacing) * 0.5);
          margin-bottom: calc(var(--spacing) * 2);
          padding: calc(var(--spacing) * 1.5);
          background: var(--bg-secondary);
          border-radius: var(--radius);
          font-size: 12px;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: calc(var(--spacing) * 0.5);
        }

        .breadcrumb {
          color: var(--accent);
          transition: all 0.2s;
          font-weight: 700;
          font-size: 12px;
        }

        .breadcrumb:hover {
          color: var(--accent-hover);
          text-decoration: underline;
        }

        .separator {
          color: var(--text-tertiary);
        }

        .form-card {
          margin-bottom: calc(var(--spacing) * 2);
        }

        .form-card form {
          display: flex;
          flex-direction: column;
          gap: calc(var(--spacing) * 2);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: calc(var(--spacing) * 1.5);
        }

        .form-card .icon-btn {
          align-self: center;
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: calc(var(--spacing) * 2);
          padding: calc(var(--spacing));
        }

        .file-item {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .file-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: calc(var(--spacing));
          padding: calc(var(--spacing) * 1.5);
          background: transparent;
          border-radius: calc(var(--radius) * 0.5);
          transition: all 0.2s;
          text-align: center;
          color: var(--text-primary);
        }

        .file-content:hover {
          background: var(--bg-secondary);
        }

        .icon-wrapper {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-light);
          flex-shrink: 0;
        }

        .icon-wrapper svg {
          width: 48px;
          height: 48px;
        }

        .custom-icon {
          width: 64px;
          height: 64px;
          object-fit: contain;
        }

        .name {
          font-size: 13px;
          font-weight: 700;
          word-break: break-word;
          line-height: 1.3;
        }

        .delete-btn {
          position: absolute;
          top: 0;
          right: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: calc(var(--radius) * 0.5);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--text-secondary);
        }

        .delete-btn svg {
          width: 16px;
          height: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .delete-btn:hover svg {
          transform: scale(1.2) rotate(5deg);
        }

        .delete-btn:active svg {
          transform: scale(0.95) rotate(-5deg);
        }

        @media (max-width: 768px) {
          .file-manager-container {
            padding: var(--spacing);
          }

          .file-manager-header {
            margin-bottom: var(--spacing);
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .files-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: calc(var(--spacing));
          }
        }
      `}</style>
    </div>
  )
}
