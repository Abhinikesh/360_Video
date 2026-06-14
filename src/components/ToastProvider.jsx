import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, X } from 'lucide-react'

const ToastCtx = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const remove = id => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      {/* Fixed bottom-right container */}
      <div className="fixed bottom-5 right-5 z-[300] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="toast-item pointer-events-auto bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[220px] max-w-xs"
          >
            <CheckCircle size={15} className="text-green-400 shrink-0" />
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-gray-400 hover:text-white transition-colors shrink-0 ml-1"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
