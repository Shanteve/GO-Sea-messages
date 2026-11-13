import { useState, useEffect } from 'react'
import axios from 'axios'
import { Anchor, Wind, Droplets, Send, MessageCircle, Compass, Clock, Sparkles } from 'lucide-react'
import './App.css'

export default function App() {
  const [stats, setStats] = useState({ floating: 0, drifted: 0 })
  const [message, setMessage] = useState('')
  const [author, setAuthor] = useState('')
  const [caughtBottles, setCaughtBottles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/stats')
        setStats(res.data)
      } catch (err) {
        console.error("Ошибка статистики", err)
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 3000)
    return () => clearInterval(interval)
  }, [])

  const showNotify = (text, type = 'success') => {
    setNotification({ text, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const throwBottle = async () => {
    if (!message.trim()) {
      showNotify('Послание не может быть пустым', 'error')
      return
    }
    setIsLoading(true)
    try {
      await axios.post('/api/throw', { message, author: author || 'Неизвестный мореплаватель' })
      showNotify('Послание унесено течением... 🌊')
      setMessage('')
      setAuthor('')
    } catch (err) {
      showNotify(err.response?.data?.error || 'Ошибка отправки', 'error')
    } finally {
      setTimeout(() => setIsLoading(false), 500)
    }
  }

  const catchBottle = async () => {
    setIsLoading(true)
    try {
      const res = await axios.get('/api/catch')
      setCaughtBottles(prev => [res.data, ...prev])
      showNotify('Вы поймали послание!', 'success')
      console.log(res.data.Date)
    } catch (err) {
      showNotify(err.response?.data?.message || 'В этом месте океан пуст...', 'info')
    } finally {
      setTimeout(() => setIsLoading(false), 500)
    }
  }

  return (
    <div className="min-h-screen relative py-8 px-4 sm:px-6">
      {/* Фоновые декоративные элементы */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-float"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-float" style={{animationDelay: '2s'}}></div>

      {/* Уведомления */}
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full glass-panel font-heading font-semibold shadow-2xl animate-float ${
          notification.type === 'error' ? 'border-red-500/30 text-red-200' : 
          notification.type === 'info' ? 'border-blue-500/30 text-blue-200' : 'border-green-500/30 text-green-200'
        }`}>
          {notification.text}
        </div>
      )}

      <div className="max-w-2xl mx-auto relative z-10 space-y-6">
        
        {/* Заголовок */}
        <div className="text-center space-y-2 animate-float">
          <div className="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-4">
            <Compass className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 drop-shadow-sm">
            Deep Sea Messages
          </h1>
          <p className="text-blue-200/60 text-lg font-light max-w-md mx-auto">
            Отправь своё послание в океан или поймай чужое.
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02]">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Wind className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-3xl font-bold font-heading text-white">{stats.floating}</div>
              <div className="text-sm text-blue-200/60">В плавании</div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02]">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <Droplets className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="text-3xl font-bold font-heading text-white">{stats.drifted}</div>
              <div className="text-sm text-blue-200/60">Доступно для поимки</div>
            </div>
          </div>
        </div>

        {/* Основная панель действий */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Send className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold font-heading text-white">Действия с океаном</h2>
          </div>
          
          <input
            className="ocean-input w-full px-4 py-3 rounded-xl font-light"
            placeholder="Кто отправляет? (необязательно)"
            value={author}
            onChange={e => setAuthor(e.target.value)}
          />
          <textarea
            className="ocean-input w-full px-4 py-3 rounded-xl font-light resize-none"
            placeholder="Напиши то, что хочешь доверить океану..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows="3"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button 
              className="ocean-btn py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-heading rounded-xl shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              onClick={throwBottle}
              disabled={isLoading}
            >
              {isLoading ? 'Отправляем...' : 'Бросить в океан'}
              <Anchor className="w-5 h-5" />
            </button>

            <button 
              className="ocean-btn py-4 bg-gradient-to-r from-blue-800 to-blue-950 hover:from-blue-700 hover:to-blue-900 text-white font-bold font-heading rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 disabled:opacity-50 border border-blue-500/20"
              onClick={catchBottle}
              disabled={isLoading}
            >
              {isLoading ? 'Ищем в глубине...' : 'Поймать послание'}
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Список пойманных бутылок */}
        {caughtBottles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-blue-200/80 flex items-center gap-2 px-2">
              <Clock className="w-4 h-4" />
              Ваши находки ({caughtBottles.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scroll pr-2">
              {caughtBottles.map((bottle, index) => (
                <div key={bottle.id + index} className="glass-panel rounded-2xl p-5 border-l-4 border-l-amber-500/50 animate-float" style={{animationDuration: '5s', animationDelay: `${index * 0.1}s`}}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-amber-300 font-heading flex items-center gap-2">
                      <MessageCircle className="w-3 h-3" /> {bottle.author}
                    </span>
                    <span className="text-xs text-blue-200/40">
                      {new Date(bottle.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-blue-100 leading-relaxed font-light italic">
                    "{bottle.message}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}