import { memo, useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
  Anchor,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  Copy,
  Droplets,
  Inbox,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  UserRound,
  Waves,
  Wind,
  X,
} from 'lucide-react'
import './App.css'

const MAX_MESSAGE_LENGTH = 500
const MAX_CAUGHT_MESSAGES = 30
const UNKNOWN_AUTHOR = 'Неизвестный мореплаватель'
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDate(value) {
  if (!value) return 'Дата неизвестна'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Дата неизвестна' : dateFormatter.format(date)
}

const AnimatedNumber = memo(function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(Number(value) || 0)
  const previousValue = useRef(Number(value) || 0)

  useEffect(() => {
    const target = Number(value) || 0
    const start = previousValue.current
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false

    if (reduceMotion || start === target) {
      setDisplayValue((current) => (current === target ? current : target))
      previousValue.current = target
      return undefined
    }

    const startedAt = performance.now()
    const duration = 550
    let frameId

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplayValue(Math.round(start + (target - start) * eased))

      if (progress < 1) frameId = window.requestAnimationFrame(tick)
      else previousValue.current = target
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [value])

  return <span>{displayValue.toLocaleString('ru-RU')}</span>
})

function FishGlyph() {
  return (
    <svg className="fish-glyph" viewBox="0 0 100 54" focusable="false" aria-hidden="true">
      <path className="fish-tail" d="M17 27 1 12 3 27 1 42Z" />
      <path className="fish-body" d="M14 27C25 8 62 7 79 27 62 47 25 46 14 27Z" />
      <path className="fish-fin" d="m43 11 12-9 9 11M47 43l12 8 8-10" />
      <path className="fish-gill" d="M68 18c-5 5-5 13 0 18" />
      <circle className="fish-eye" cx="72" cy="23" r="2.1" />
    </svg>
  )
}

// Memoization keeps the decorative scene out of App's routine re-renders.
const OceanBackground = memo(function OceanBackground() {
  const [isVisible, setIsVisible] = useState(document.visibilityState === 'visible')

  useEffect(() => {
    const updateVisibility = () => setIsVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  return (
    <div className="ocean-life" data-paused={!isVisible} aria-hidden="true">
      <div className="ocean-light-rays">
        <span className="light-ray light-ray--one" />
        <span className="light-ray light-ray--two" />
        <span className="light-ray light-ray--three" />
      </div>

      {/* Static marine-snow texture: no animated background-position repaint. */}
      <div className="marine-snow" />

      <div className="fish-school fish-school--one">
        <FishGlyph /><FishGlyph /><FishGlyph />
      </div>
      <div className="fish-school fish-school--two">
        <FishGlyph /><FishGlyph /><FishGlyph />
      </div>
      <div className="fish-school fish-school--three">
        <FishGlyph /><FishGlyph />
      </div>

      <div className="manta-ray">
        <svg viewBox="0 0 180 94" focusable="false">
          <path d="M90 39C67 8 30 5 3 17c25 7 40 23 56 39-17 2-32 12-43 25 30-6 53-12 74-28 21 16 44 22 74 28-11-13-26-23-43-25 16-16 31-32 56-39-27-12-64-9-87 22Z" />
          <path d="M90 48c-2 13-2 25 0 39" className="manta-tail" />
        </svg>
      </div>

      <div className="jellyfish jellyfish--one">
        <span className="jellyfish-bell" />
        <span className="jellyfish-tentacle jellyfish-tentacle--one" />
        <span className="jellyfish-tentacle jellyfish-tentacle--two" />
        <span className="jellyfish-tentacle jellyfish-tentacle--three" />
      </div>
      <div className="jellyfish jellyfish--two">
        <span className="jellyfish-bell" />
        <span className="jellyfish-tentacle jellyfish-tentacle--one" />
        <span className="jellyfish-tentacle jellyfish-tentacle--two" />
        <span className="jellyfish-tentacle jellyfish-tentacle--three" />
      </div>

      <div className="ocean-bubbles">
        <span className="ocean-bubble ocean-bubble--one" />
        <span className="ocean-bubble ocean-bubble--two" />
        <span className="ocean-bubble ocean-bubble--three" />
        <span className="ocean-bubble ocean-bubble--four" />
        <span className="ocean-bubble ocean-bubble--five" />
      </div>
    </div>
  )
})

const MessageCard = memo(function MessageCard({ bottle, isCopied, onCopy }) {
  const bottleDate = bottle.create_at ?? bottle.created_at
  const bottleKey = String(bottle.id ?? `${bottleDate ?? 'message'}-${bottle.message ?? ''}`)
  const authorName = bottle.author || UNKNOWN_AUTHOR
  const initial = authorName.trim().charAt(0).toUpperCase() || 'О'

  return (
    <article className="glass-panel message-card">
      <div className="message-card-top">
        <div className="message-author-wrap">
          <div className="author-avatar" aria-hidden="true">{initial}</div>
          <div className="message-author-details">
            <span className="message-author">{authorName}</span>
            <span className="message-date"><CalendarDays size={13} /> {formatDate(bottleDate)}</span>
          </div>
        </div>
        <button
          type="button"
          className="copy-btn"
          onClick={() => onCopy(bottle.message || '', bottleKey)}
          aria-label="Скопировать текст послания"
          title="Скопировать послание"
        >
          {isCopied ? <Check size={16} /> : <Copy size={16} />}
          <span>{isCopied ? 'Скопировано' : 'Копировать'}</span>
        </button>
      </div>
      <p className="message-text">{bottle.message}</p>
      <div className="message-card-footer"><Clock3 size={13} /> Найдено в глубинах океана</div>
    </article>
  )
})

export default function App() {
  const [stats, setStats] = useState({ floating: 0, drifted: 0 })
  const [message, setMessage] = useState('')
  const [author, setAuthor] = useState('')
  const [caughtBottles, setCaughtBottles] = useState([])
  const [loadingAction, setLoadingAction] = useState(null)
  const [notification, setNotification] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [revealedBottle, setRevealedBottle] = useState(null)
  const copyTimerRef = useRef(null)
  const revealCloseButtonRef = useRef(null)
  const isLoading = loadingAction !== null

  // Poll only while the tab is visible; don't re-render when values haven't changed.
  useEffect(() => {
    const controller = new AbortController()
    let requestInFlight = false

    const fetchStats = async () => {
      if (document.visibilityState !== 'visible' || requestInFlight || controller.signal.aborted) return
      requestInFlight = true

      try {
        const res = await axios.get('/api/stats', { signal: controller.signal })
        if (!controller.signal.aborted) {
          const nextStats = {
            floating: Math.max(0, Number(res.data?.floating) || 0),
            drifted: Math.max(0, Number(res.data?.drifted) || 0),
          }
          setStats((current) => (
            current.floating === nextStats.floating && current.drifted === nextStats.drifted
              ? current
              : nextStats
          ))
        }
      } catch (err) {
        if (!controller.signal.aborted) console.error('Ошибка статистики', err)
      } finally {
        requestInFlight = false
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchStats()
    }

    fetchStats()
    const interval = window.setInterval(fetchStats, 15000)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!notification) return undefined
    const notificationId = notification.id

    const leaveTimeout = window.setTimeout(() => {
      setNotification((current) => (
        current?.id === notificationId ? { ...current, leaving: true } : current
      ))
    }, 2800)
    const removeTimeout = window.setTimeout(() => {
      setNotification((current) => (current?.id === notificationId ? null : current))
    }, 3200)

    return () => {
      window.clearTimeout(leaveTimeout)
      window.clearTimeout(removeTimeout)
    }
  }, [notification?.id])

  useEffect(() => () => {
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
  }, [])

  useEffect(() => {
    if (!revealedBottle) return undefined
    const previousActiveElement = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    revealCloseButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setRevealedBottle(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      if (previousActiveElement instanceof HTMLElement) previousActiveElement.focus()
    }
  }, [revealedBottle?.revealKey])

  const showNotify = useCallback((text, type = 'success') => {
    setNotification({ text, type, id: Date.now() })
  }, [])

  const throwBottle = async () => {
    if (isLoading) return
    if (!message.trim()) {
      showNotify('Послание не может быть пустым', 'error')
      return
    }

    setLoadingAction('throw')
    try {
      await axios.post('/api/throw', {
        message: message.trim(),
        author: author.trim() || UNKNOWN_AUTHOR,
      })
      showNotify('Послание унесено течением... 🌊')
      setMessage('')
      setAuthor('')
    } catch (err) {
      showNotify(err.response?.data?.error || 'Не удалось отправить послание', 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  const catchBottle = async () => {
    if (isLoading) return
    setLoadingAction('catch')

    try {
      const res = await axios.get('/api/catch')
      if (res.data && typeof res.data === 'object') {
        const bottle = res.data
        setCaughtBottles((previous) => {
          const next = bottle.id
            ? [bottle, ...previous.filter((item) => item.id !== bottle.id)]
            : [bottle, ...previous]
          return next.slice(0, MAX_CAUGHT_MESSAGES)
        })
        setRevealedBottle({ ...bottle, revealKey: `${bottle.id ?? 'bottle'}-${Date.now()}` })
      } else {
        showNotify('В этом месте океан пуст...', 'info')
      }
    } catch (err) {
      showNotify(err.response?.data?.message || 'В этом месте океан пуст...', 'info')
    } finally {
      setLoadingAction(null)
    }
  }

  const copyMessage = useCallback(async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      showNotify('Текст послания скопирован')
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 1800)
    } catch {
      showNotify('Не удалось скопировать текст', 'error')
    }
  }, [showNotify])

  return (
    <main className="app-shell">
      <OceanBackground />

      {notification && (
        <div
          key={notification.id}
          className={`notification notification--${notification.type} ${notification.leaving ? 'notification--leaving' : ''}`}
          role={notification.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <span className="notification-dot" aria-hidden="true" />
          {notification.text}
        </div>
      )}

      {revealedBottle && (
        <div
          className="reveal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setRevealedBottle(null)
          }}
        >
          <section
            key={revealedBottle.revealKey}
            className="reveal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reveal-title"
            aria-describedby="reveal-message"
          >
            <button
              ref={revealCloseButtonRef}
              type="button"
              className="reveal-close"
              onClick={() => setRevealedBottle(null)}
              aria-label="Закрыть послание"
            >
              <X size={19} />
            </button>

            <div className="reveal-heading">
              <p className="eyebrow reveal-eyebrow">ТЕЧЕНИЕ ПРИНЕСЛО ТЕБЕ ЧТО-ТО ОСОБЕННОЕ</p>
              <div className="reveal-bottle-scene" aria-hidden="true">
                <span className="reveal-bubble reveal-bubble--one" />
                <span className="reveal-bubble reveal-bubble--two" />
                <span className="reveal-bubble reveal-bubble--three" />
                <div className="reveal-bottle">
                  <span className="reveal-bottle-cork" />
                  <span className="reveal-bottle-neck" />
                  <span className="reveal-bottle-body"><span className="reveal-bottle-label"><Sparkles size={18} /></span></span>
                  <span className="reveal-bottle-shine" />
                </div>
                <span className="reveal-bottle-shadow" />
              </div>
              <h2 id="reveal-title">Послание нашло тебя</h2>
              <p className="reveal-subtitle">Незнакомая история проделала долгий путь, чтобы оказаться здесь.</p>
            </div>

            <article className="revealed-letter">
              <div className="revealed-letter-top">
                <div className="revealed-author-avatar" aria-hidden="true">
                  {(revealedBottle.author || UNKNOWN_AUTHOR).trim().charAt(0).toUpperCase() || 'О'}
                </div>
                <div className="revealed-author-details">
                  <span className="revealed-author">{revealedBottle.author || UNKNOWN_AUTHOR}</span>
                  <span className="revealed-date">
                    <CalendarDays size={13} />
                    {formatDate(revealedBottle.create_at ?? revealedBottle.created_at)}
                  </span>
                </div>
                <Sparkles className="revealed-letter-sparkle" size={19} aria-hidden="true" />
              </div>
              <p id="reveal-message" className="revealed-message">
                {revealedBottle.message || 'В этой бутылке оказалось пустое послание.'}
              </p>
              <div className="revealed-letter-footer"><Waves size={14} /><span>Найдено в глубинах океана</span></div>
            </article>

            <div className="reveal-actions">
              <button
                type="button"
                className="reveal-copy-btn"
                onClick={() => copyMessage(revealedBottle.message || '', revealedBottle.revealKey)}
              >
                {copiedId === revealedBottle.revealKey ? <Check size={16} /> : <Copy size={16} />}
                {copiedId === revealedBottle.revealKey ? 'Скопировано' : 'Копировать текст'}
              </button>
              <button
                type="button"
                className="ocean-btn ocean-btn--primary reveal-return-btn"
                onClick={() => setRevealedBottle(null)}
              >
                Вернуться к океану <Waves size={18} />
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="app-content">
        <header className="hero">
          <div className="hero-mark" aria-hidden="true">
            <Compass size={31} strokeWidth={1.7} />
            <span className="hero-mark-sparkle"><Sparkles size={13} /></span>
          </div>
          <p className="eyebrow">ТВОЯ ИСТОРИЯ В БЕСКРАЙНЕМ ОКЕАНЕ</p>
          <h1>Deep Sea <span>Messages</span></h1>
          <p className="hero-description">Отправь своё послание в океан или поймай то, что оставил кто-то другой.</p>
          <div className="ocean-status"><span className="status-pulse" aria-hidden="true" />Здесь всегда есть место для новой истории</div>
        </header>

        <section className="stats-grid" aria-label="Статистика океана">
          <article className="glass-panel stat-card">
            <div className="stat-icon stat-icon--blue"><Wind size={23} strokeWidth={1.8} /></div>
            <div className="stat-copy">
              <span className="stat-label">В плавании</span>
              <strong className="stat-value"><AnimatedNumber value={stats.floating} /></strong>
              <span className="stat-caption">посланий покинули берег</span>
            </div>
            <Waves className="stat-decoration" size={72} strokeWidth={0.8} aria-hidden="true" />
          </article>
          <article className="glass-panel stat-card">
            <div className="stat-icon stat-icon--cyan"><Droplets size={23} strokeWidth={1.8} /></div>
            <div className="stat-copy">
              <span className="stat-label">Доступно для поимки</span>
              <strong className="stat-value"><AnimatedNumber value={stats.drifted} /></strong>
              <span className="stat-caption">посланий ждут своего читателя</span>
            </div>
            <Sparkles className="stat-decoration" size={70} strokeWidth={0.8} aria-hidden="true" />
          </article>
        </section>

        <section className="glass-panel action-panel" aria-labelledby="actions-title">
          <div className="section-heading">
            <div className="section-icon"><Send size={20} /></div>
            <div>
              <p className="eyebrow section-eyebrow">СОЗДАЙ СВОЮ ИСТОРИЮ</p>
              <h2 id="actions-title">Действия с океаном</h2>
            </div>
          </div>
          <p className="panel-description">Оставь несколько строк незнакомцу или отправься на поиски чужой истории.</p>

          <form
            className="message-form"
            onSubmit={(event) => {
              event.preventDefault()
              throwBottle()
            }}
          >
            <div className="form-field">
              <label className="field-label" htmlFor="message-author">Твоё имя <span>необязательно</span></label>
              <div className="input-wrap">
                <UserRound className="input-icon" size={18} aria-hidden="true" />
                <input
                  id="message-author"
                  className="ocean-input"
                  type="text"
                  placeholder="Как тебя называть?"
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  maxLength={60}
                  autoComplete="name"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="field-label" htmlFor="message-text">Твоё послание</label>
              <textarea
                id="message-text"
                className="ocean-input ocean-textarea"
                placeholder="Напиши то, что хочешь доверить океану..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={4}
                disabled={isLoading}
              />
              <div className="textarea-meta">
                <span className="input-hint">Иногда несколько искренних слов — это целый мир.</span>
                <span className={`character-count ${message.length >= MAX_MESSAGE_LENGTH ? 'character-count--limit' : ''}`}>
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>
            </div>

            <div className="actions-grid">
              <button type="submit" className="ocean-btn ocean-btn--primary" disabled={isLoading} aria-busy={loadingAction === 'throw'}>
                {loadingAction === 'throw' ? <><LoaderCircle className="loading-icon" size={19} /> Отправляем...</> : <>Бросить в океан <Anchor size={19} /></>}
              </button>
              <button type="button" className="ocean-btn ocean-btn--secondary" onClick={catchBottle} disabled={isLoading} aria-busy={loadingAction === 'catch'}>
                {loadingAction === 'catch' ? <><LoaderCircle className="loading-icon" size={19} /> Ищем в глубине...</> : <>Поймать послание <Sparkles size={19} /></>}
              </button>
            </div>
          </form>

          <div className="panel-footer"><Waves size={16} aria-hidden="true" /><span>Каждое послание отправляется в собственное плавание.</span></div>
        </section>

        <section className="messages-section" aria-labelledby="messages-title">
          <div className="messages-heading">
            <div className="messages-title-wrap">
              <div className="section-icon section-icon--small"><MessageCircle size={18} /></div>
              <div>
                <p className="eyebrow section-eyebrow">СЛУЧАЙНЫЕ ВСТРЕЧИ</p>
                <h2 id="messages-title">Твои находки <span className="findings-count">{caughtBottles.length}</span></h2>
              </div>
            </div>
            <span className="messages-caption">Последние {MAX_CAUGHT_MESSAGES} найденных посланий</span>
          </div>

          {caughtBottles.length === 0 ? (
            <div className="glass-panel empty-state">
              <div className="empty-icon"><Inbox size={29} strokeWidth={1.5} /></div>
              <h3>Океан пока молчит</h3>
              <p>Попробуй поймать послание — возможно, кто-то уже оставил историю именно для тебя.</p>
              <span className="empty-decoration" aria-hidden="true"><Sparkles size={16} /></span>
            </div>
          ) : (
            <div className="message-list" aria-live="polite">
              {caughtBottles.map((bottle) => {
                const key = String(bottle.id ?? `${bottle.create_at ?? bottle.created_at ?? 'message'}-${bottle.message ?? ''}`)
                return (
                  <MessageCard
                    key={key}
                    bottle={bottle}
                    isCopied={copiedId === key}
                    onCopy={copyMessage}
                  />
                )
              })}
            </div>
          )}
        </section>

        <footer className="app-footer">
          <span className="footer-wave"><Waves size={17} /></span>
          <span>Deep Sea Messages</span>
          <span className="footer-separator">·</span>
          <span>Истории не знают границ</span>
        </footer>
      </div>
    </main>
  )
}
