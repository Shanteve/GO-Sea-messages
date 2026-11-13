import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'
import axios from 'axios'

const API = 'http://localhost:8080/api'

export default function App() {
  const [stats, setStats] = useState({ floating: 0, drifted: 0 })
  const [caughtBottles, setCaughtBottles] = useState([])
  const [message, setMessage] = useState('')
  const [author, setAuthor] = useState('')
  const [notification, setNotification] = useState(null)
  const [isThrowing, setIsThrowing] = useState(false)
  const [isCatching, setIsCatching] = useState(false)

  // Подтягиваем статистику каждые 2 секунды
  useEffect(() => {
    const interval = setInterval(() => {
      axios.get(`${API}/stats`)
        .then(res => setStats(res.data))
        .catch(() => {})
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const showNotification = (text, type = 'info') => {
    setNotification({ text, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const throwBottle = async () => {
    if (!message.trim()) {
      showNotification('Напиши послание! 📝', 'error')
      return
    }
    setIsThrowing(true)
    try {
      await axios.post(`${API}/throw`, { message, author: author || 'Аноним' })
      showNotification('Бутылка брошена в океан! 🌊', 'success')
      setMessage('')
    } catch (err) {
      const msg = err.response?.data?.error || 'Ошибка'
      showNotification(msg, 'error')
    } finally {
      setTimeout(() => setIsThrowing(false), 800)
    }
  }

  const catchBottle = async () => {
    setIsCatching(true)
    try {
      const res = await axios.get(`${API}/catch`)
      setCaughtBottles(prev => [res.data, ...prev].slice(0, 10))
      showNotification('Ты поймал бутылку! 🍾', 'success')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Океан пуст'
      showNotification(msg, 'error')
    } finally {
      setTimeout(() => setIsCatching(false), 800)
    }
  }

  return (
    <div className="app">
      {/* Анимированный океан на фоне */}
      <div className="ocean">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      {/* Уведомления */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className={`notification ${notification.type}`}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
          >
            {notification.text}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="container">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="title"
        >
          🌊 Послание в бутылке
        </motion.h1>

        {/* Статистика */}
        <div className="stats">
          <div className="stat">
            <span className="stat-icon">🍾</span>
            <div>
              <div className="stat-value">{stats.floating}</div>
              <div className="stat-label">плывут</div>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">🏝️</span>
            <div>
              <div className="stat-value">{stats.drifted}</div>
              <div className="stat-label">доступны</div>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">📦</span>
            <div>
              <div className="stat-value">{caughtBottles.length}</div>
              <div className="stat-label">поймано</div>
            </div>
          </div>
        </div>

        {/* Форма отправки */}
        <motion.div
          className="card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2>✉️ Бросить бутылку</h2>
          <input
            type="text"
            placeholder="Твоё имя (необязательно)"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="input"
          />
          <textarea
            placeholder="Напиши послание..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="textarea"
            rows="3"
          />
          <motion.button
            className="btn btn-throw"
            onClick={throwBottle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isThrowing ? { rotate: [0, -10, 10, -10, 0] } : {}}
            disabled={isThrowing}
          >
            {isThrowing ? '🌊 Бросаю...' : '🚀 Бросить в океан'}
          </motion.button>
        </motion.div>

        {/* Кнопка поимки */}
        <motion.button
          className="btn btn-catch"
          onClick={catchBottle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={isCatching ? { y: [0, -10, 0] } : {}}
          disabled={isCatching}
        >
          {isCatching ? '🎣 Ловлю...' : '🎣 Поймать случайную бутылку'}
        </motion.button>

        {/* Пойманные бутылки */}
        <AnimatePresence>
          {caughtBottles.length > 0 && (
            <motion.div
              className="caught-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2>📜 Твоя коллекция</h2>
              {caughtBottles.map((b, i) => (
                <motion.div
                  key={b.id + i}
                  className="bottle-card"
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="bottle-author">— {b.author}</div>
                  <div className="bottle-message">{b.message}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}