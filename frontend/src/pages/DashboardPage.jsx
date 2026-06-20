import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTypewriter } from '../hooks/useTypewriter'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { displayed, done } = useTypewriter('Seamlessly manage products, track orders, and monitor your entire catalog in real-time.', 38, 600)

  const [showPills, setShowPills] = useState(false)

  useEffect(() => {
    // Show pills 400ms after component mounts (independent of typewriter)
    const t = setTimeout(() => setShowPills(true), 400)
    return () => clearTimeout(t)
  }, [])

  const copyEmail = () => {
    navigator.clipboard.writeText('support@inventrack.co')
  }

  return (
    <div className="h-screen flex flex-col justify-end pb-12 md:justify-center md:pb-0 px-5 sm:px-8 md:px-10 overflow-hidden relative z-10 -mt-[80px]">
      <div className="max-w-xl relative z-10 w-full pt-[80px]">
        {/* Blurred intro label */}
        <p
          className="pointer-events-none select-none mb-5 sm:mb-6 text-black"
          style={{
            fontSize: 'clamp(18px, 4vw, 26px)',
            lineHeight: 1.3,
            fontWeight: 400,
            filter: 'blur(3px)',
          }}
        >
          Welcome to InvenTrack,<br />
          Your unified inventory command center.
        </p>

        {/* Typewriter text */}
        <h1
          className="text-black mb-5 sm:mb-6 min-h-[54px]"
          style={{
            fontSize: 'clamp(18px, 4vw, 26px)',
            lineHeight: 1.35,
            fontWeight: 400,
          }}
        >
          {displayed}
          {!done && (
            <span
              className="inline-block w-[2px] bg-black align-middle ml-[2px]"
              style={{ height: '1.1em', animation: 'blink 1s step-end infinite' }}
            />
          )}
        </h1>

        {/* Action pill buttons */}
        <div
          className={`flex flex-wrap gap-y-1 transition-all duration-400 ease-out ${showPills ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
        >
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-black hover:text-white transition-colors duration-200"
          >
            Add a new product
          </button>

          <button
            onClick={() => navigate('/customers')}
            className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-black hover:text-white transition-colors duration-200"
          >
            View customer directory
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-black hover:text-white transition-colors duration-200"
          >
            Review latest orders
          </button>

          <button
            className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-black hover:text-white transition-colors duration-200"
          >
            Generate sales report
          </button>

          <button
            onClick={copyEmail}
            className="inline-flex items-center justify-center text-white bg-transparent border border-white rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap gap-2 sm:gap-3 hover:bg-white hover:text-black transition-colors duration-200"
          >
            <span>Reach us: <span className="underline underline-offset-1">support@inventrack.co</span></span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
