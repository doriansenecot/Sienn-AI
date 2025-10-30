import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass-card p-12 max-w-2xl animate-fade-in-up">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 animate-glow mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
            Sienn AI
          </h1>
          
          <p className="text-xl text-slate-300">
            Fine-Tuning Platform with Liquid Glass Design
          </p>

          {/* Counter Demo */}
          <div className="glass-card-medium p-6 space-y-4">
            <p className="text-slate-400">Architecture Setup Test</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setCount(count - 1)}
                className="glass-button px-6 py-3 text-lg"
              >
                -
              </button>
              <span className="text-4xl font-bold text-primary-400 w-20">
                {count}
              </span>
              <button
                onClick={() => setCount(count + 1)}
                className="glass-button-primary px-6 py-3 text-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-3 justify-center flex-wrap">
            <span className="glass-badge">
              ⚡ Vite
            </span>
            <span className="glass-badge">
              ⚛️ React 18
            </span>
            <span className="glass-badge">
              🎨 Tailwind CSS
            </span>
            <span className="glass-badge">
              💎 Liquid Glass
            </span>
            <span className="glass-badge">
              📘 TypeScript
            </span>
          </div>

          {/* Info */}
          <div className="glass-frosted p-4 rounded-xl text-sm text-slate-400">
            <p>🎯 Frontend architecture ready!</p>
            <p className="text-xs mt-2">Next: UI Components → Services → Pages</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
