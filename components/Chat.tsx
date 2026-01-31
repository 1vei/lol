'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { extractYouTubeId, isValidUrl, isImageUrl, isVideoUrl, getOrCreateSessionId } from '@/lib/utils'
import { format } from 'date-fns'

interface Message {
  id: string
  content: string
  author_name: string | null
  session_id: string
  created_at: string
  is_admin: boolean
  is_private: boolean
  reply_to: string | null
  youtube_id: string | null
  giphy_url: string | null
  image_url: string | null
  video_url: string | null
}

interface ChatProps {
  isAdmin: boolean
}

export default function Chat({ isAdmin }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [swipeStartX, setSwipeStartX] = useState(0)
  const [swipingMessageId, setSwipingMessageId] = useState<string | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const contentInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const sid = getOrCreateSessionId()
    setSessionId(sid)
    
    const savedName = localStorage.getItem('chat_author_name')
    const savedContent = localStorage.getItem('chat_content')
    if (savedName) setAuthorName(savedName)
    if (savedContent) setContent(savedContent)
    
    fetchMessages()
    fetchCount()
    
    const interval = setInterval(() => {
      fetchMessages()
      fetchCount()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [isAdmin])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    localStorage.setItem('chat_author_name', authorName)
  }, [authorName])

  useEffect(() => {
    localStorage.setItem('chat_content', content)
  }, [content])

  const fetchMessages = async () => {
    const sid = getOrCreateSessionId()
    
    const res = await fetch(`/api/chat?session_id=${sid}&is_admin=${isAdmin}`)
    const data = await res.json()
    
    if (data.messages) setMessages(data.messages)
  }

  const fetchCount = async () => {
    const sid = getOrCreateSessionId()
    const res = await fetch(`/api/chat/count?is_admin=${isAdmin}&session_id=${sid}`)
    const data = await res.json()
    
    if (data.count !== undefined) setTotalCount(data.count)
  }

  const canSwipe = !editingId

  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent, messageId: string) => {
    if (!canSwipe) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    setSwipeStartX(clientX)
    setSwipingMessageId(messageId)
  }

  const handleSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!swipingMessageId || !canSwipe) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const diff = clientX - swipeStartX
    if (Math.abs(diff) < 100) {
      setSwipeOffset(diff)
    }
  }

  const handleSwipeEnd = () => {
    if (!canSwipe) return
    if (Math.abs(swipeOffset) > 50 && swipingMessageId) {
      const message = messages.find(m => m.id === swipingMessageId)
      if (message) {
        setReplyingTo(message)
        contentInputRef.current?.focus()
      }
    }
    setSwipeOffset(0)
    setSwipingMessageId(null)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    if (replyingTo) {
      const prefix = `${replyingTo.author_name || 'Anonymous'}, `
      if (!value.startsWith(prefix)) {
        setReplyingTo(null)
        setContent(value)
      } else {
        setContent(value.substring(prefix.length))
      }
    } else {
      setContent(value)
    }
  }

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!replyingTo) return
    
    const input = e.currentTarget
    const cursorPos = input.selectionStart || 0
    const prefix = `${replyingTo.author_name || 'Anonymous'}, `
    
    if (e.key === 'Backspace' && cursorPos <= prefix.length) {
      e.preventDefault()
      setReplyingTo(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || loading) return

    setLoading(true)
    
    const youtubeId = extractYouTubeId(content)
    const giphyUrl = content.includes('giphy.com') && isValidUrl(content) ? content : null
    
    let imageUrl = null
    let videoUrl = null
    
    const urls = content.match(/https?:\/\/[^\s]+/g)
    if (urls) {
      for (const url of urls) {
        if (isImageUrl(url)) {
          imageUrl = url
          break
        } else if (isVideoUrl(url) && !youtubeId) {
          videoUrl = url
          break
        }
      }
    }

    let shouldBePrivate = isPrivate
    if (replyingTo && isAdmin) {
      const replyToMessage = messages.find(m => m.id === replyingTo.id)
      if (replyToMessage?.is_private) {
        shouldBePrivate = true
      }
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          author_name: authorName || null,
          session_id: sessionId,
          is_admin: isAdmin,
          is_private: shouldBePrivate,
          reply_to: replyingTo?.id || null,
          youtube_id: youtubeId,
          giphy_url: giphyUrl,
          image_url: imageUrl,
          video_url: videoUrl,
        }),
      })

      if (res.ok) {
        setContent('')
        localStorage.removeItem('chat_content')
        setReplyingTo(null)
        setIsPrivate(false)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to send message')
      }
    } catch (error) {
      alert('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return
    
    await fetch(`/api/chat/${id}`, { method: 'DELETE' })
  }

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return
    
    await fetch(`/api/chat/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    })
    
    setEditingId(null)
    setEditContent('')
  }

  const startEdit = (message: Message) => {
    setEditingId(message.id)
    setEditContent(message.content)
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="message-count">{totalCount}</span>
      </div>

      <div className="messages">
        {messages.map((message) => {
          const replyToMessage = message.reply_to 
            ? messages.find(m => m.id === message.reply_to)
            : null

          return (
            <div
              key={message.id}
              className={`message ${message.is_admin ? 'admin' : ''} ${message.is_private ? 'private' : ''}`}
              style={{
                transform: swipingMessageId === message.id ? `translateX(${swipeOffset}px)` : 'none',
                transition: swipingMessageId === message.id ? 'none' : 'transform 0.2s',
              }}
              onTouchStart={(e) => handleSwipeStart(e, message.id)}
              onTouchMove={handleSwipeMove}
              onTouchEnd={handleSwipeEnd}
              onMouseDown={(e) => handleSwipeStart(e, message.id)}
              onMouseMove={handleSwipeMove}
              onMouseUp={handleSwipeEnd}
            >
              <div className="message-actions">
                <button 
                  className="action-btn" 
                  onClick={() => {
                    setReplyingTo(message)
                    contentInputRef.current?.focus()
                  }}
                  title="Reply"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 14L4 9l5-5" />
                    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                  </svg>
                </button>
                {isAdmin && (
                  <>
                    <button className="action-btn" onClick={() => startEdit(message)} title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button className="action-btn" onClick={() => handleDelete(message.id)} title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              <div className="message-header">
                <div className="message-info">
                  <span className="author">
                    {message.author_name || 'Anonymous'}
                    {message.is_admin && (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{display: 'inline', marginLeft: '4px'}}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    )}
                    {message.is_private && (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{display: 'inline', marginLeft: '4px'}}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                  </span>
                  <span className="time">
                    {format(new Date(message.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>

            {editingId === message.id ? (
              <div className="edit-form">
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <input
                    className="input"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                </div>
                <div className="edit-actions">
                  <button className="icon-btn" onClick={() => handleEdit(message.id)} title="Save">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <button className="icon-btn" onClick={() => setEditingId(null)} title="Cancel">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {replyToMessage ? (
                  <div className="message-content">
                    <span className="reply-name">{replyToMessage.author_name || 'Anonymous'}</span>, {message.content}
                  </div>
                ) : (
                  <div className="message-content">{message.content}</div>
                )}

                {message.youtube_id && (
                  <div className="media-embed">
                    <iframe
                      width="100%"
                      height="315"
                      src={`https://www.youtube.com/embed/${message.youtube_id}`}
                      style={{border: 0}}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {message.giphy_url && (
                  <div className="media-embed">
                    <img src={message.giphy_url} alt="GIF" />
                  </div>
                )}

                {message.image_url && (
                  <div className="media-embed">
                    <img src={message.image_url} alt="Image" />
                  </div>
                )}

                {message.video_url && (
                  <div className="media-embed">
                    <video src={message.video_url} controls />
                  </div>
                )}
              </>
            )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input
            className="input"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Name"
          />
        </div>
        
        <div className="input-row">
          <div className="input-wrapper">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <input
              ref={contentInputRef}
              className="input reply-input"
              value={replyingTo ? `${replyingTo.author_name || 'Anonymous'}, ${content}` : content}
              onChange={handleContentChange}
              onKeyDown={handleContentKeyDown}
              disabled={loading}
              placeholder="Message"
            />
          </div>
          <button
            type="button"
            className={`icon-btn ${isPrivate ? 'active' : ''}`}
            onClick={() => setIsPrivate(!isPrivate)}
            title={isPrivate ? 'Private message' : 'Public message'}
          >
            {isPrivate ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            )}
          </button>
          <button className="icon-btn" type="submit" disabled={loading} title="Send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>

      <style jsx>{`
        .chat-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: calc(var(--spacing));
          padding: calc(var(--spacing) * 2);
          background: transparent;
          color: var(--text-secondary);
        }

        .message-count {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .icon-btn.active {
          color: var(--accent);
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: calc(var(--spacing) * 2);
          display: flex;
          flex-direction: column;
          gap: calc(var(--spacing) * 2);
        }

        .message {
          background: var(--bg-secondary);
          border-radius: var(--radius);
          padding: calc(var(--spacing) * 1.5);
          padding-right: calc(var(--spacing) * 20);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: calc(var(--spacing) * 0.75);
        }

        .message.admin {
          background: oklch(from var(--accent-light) l c h / 0.15);
          border: 1px solid var(--accent-light);
        }

        .message.private {
          background: oklch(from var(--bg-secondary) l c h / 0.5);
          border: 1px dashed var(--accent-light);
        }

        .message-actions {
          position: absolute;
          right: calc(var(--spacing) * 1.5);
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          gap: calc(var(--spacing));
          align-items: center;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: calc(var(--spacing));
        }

        .message-info {
          display: flex;
          align-items: center;
          gap: calc(var(--spacing) * 1.5);
          flex: 1;
        }

        .author {
          font-weight: 800;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          font-size: 18px;
        }

        .time {
          color: var(--text-tertiary);
          font-size: 9px;
          font-weight: 400;
        }

        .message-content {
          color: var(--text-primary);
          word-wrap: break-word;
          font-size: 16px;
          line-height: 1.4;
          font-weight: 500;
        }

        .reply-name {
          color: var(--accent);
          font-weight: 800;
          font-size: 16px;
        }

        .media-embed {
          margin-top: calc(var(--spacing));
          border-radius: var(--radius);
          overflow: hidden;
        }

        .media-embed img {
          width: 100%;
          display: block;
        }

        .media-embed iframe {
          border-radius: var(--radius);
        }

        .message-actions {
          display: flex;
          gap: calc(var(--spacing));
          align-items: center;
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

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: calc(var(--spacing) * 1.5);
        }

        .edit-actions {
          display: flex;
          gap: calc(var(--spacing));
          justify-content: center;
        }

        .chat-form {
          padding: calc(var(--spacing) * 2);
          background: transparent;
          display: flex;
          flex-direction: column;
          gap: calc(var(--spacing) * 1.5);
        }

        .input-row {
          display: flex;
          gap: calc(var(--spacing));
          align-items: center;
        }

        .input-row .input-wrapper {
          flex: 1;
        }

        .reply-input {
          color: var(--accent);
        }

        @media (min-width: 769px) {
          .chat-form {
            flex-direction: row;
            align-items: center;
          }

          .chat-form > .input-wrapper {
            width: 200px;
            flex-shrink: 0;
          }

          .input-row {
            flex: 1;
          }
        }

        @media (max-width: 768px) {
          .chat-header,
          .messages,
          .chat-form {
            padding: calc(var(--spacing) * 1.5);
          }
        }
      `}</style>
    </div>
  )
}
