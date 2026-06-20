import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/products', label: 'Products' },
  { to: '/customers', label: 'Customers' },
  { to: '/orders', label: 'Orders' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  // Close mobile menu on resize if screen becomes large enough
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-10 px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center bg-white/70 backdrop-blur-md border-b border-black/5 shadow-sm transition-all">
        
        {/* Logo (left) */}
        <div className="flex items-center gap-3">
          <span 
            className="text-[21px] sm:text-[26px] tracking-tight text-black" 
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            InvenTrack&reg;
          </span>
          <span className="text-[25px] sm:text-[30px] text-black select-none tracking-[-0.02em]">
            &#10033;
          </span>
        </div>

        {/* Desktop nav links (center) */}
        <nav className="hidden md:flex flex-row text-[23px] text-black">
          {navLinks.map((link, index) => (
            <span key={link.to}>
              <NavLink 
                to={link.to} 
                className="hover:opacity-60 transition-opacity"
              >
                {link.label}
              </NavLink>
              {index < navLinks.length - 1 && <span className="mx-1">, </span>}
            </span>
          ))}
        </nav>

        {/* Desktop CTA (right) */}
        <div className="hidden md:block">
          <a 
            href="mailto:support@inventrack.co" 
            className="text-[23px] text-black underline underline-offset-2 hover:opacity-60 transition-opacity"
          >
            Get in touch
          </a>
        </div>

        {/* Mobile hamburger button */}
        <button
          className="md:hidden flex flex-col gap-[5px] z-20"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <div 
            className={`w-6 h-[2px] bg-black transition-transform duration-300 ${
              isOpen ? 'rotate-45 translate-y-[7px]' : ''
            }`} 
          />
          <div 
            className={`w-6 h-[2px] bg-black transition-opacity duration-300 ${
              isOpen ? 'opacity-0' : 'opacity-100'
            }`} 
          />
          <div 
            className={`w-6 h-[2px] bg-black transition-transform duration-300 ${
              isOpen ? '-rotate-45 -translate-y-[7px]' : ''
            }`} 
          />
        </button>
      </header>

      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-white/95 backdrop-blur-sm z-[9] flex flex-col justify-center px-8 gap-8 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col gap-6">
          {navLinks.map(link => (
            <NavLink 
              key={link.to}
              to={link.to} 
              className="text-[32px] font-medium text-black hover:opacity-60 transition-opacity"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <a 
            href="mailto:support@inventrack.co" 
            className="text-[32px] font-medium text-black underline underline-offset-2 hover:opacity-60 transition-opacity mt-4"
          >
            Get in touch
          </a>
        </nav>
      </div>
    </>
  )
}
