'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Activity,
  Settings,
  LogOut,
  GitBranch
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/activities', icon: Activity, label: 'Activities' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link href="/dashboard" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Activity</span>
          <span className="brand-accent">Tracker</span>
        </Link>

        {/* Navigation */}
        <div className="navbar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Right Section */}
        <div className="navbar-right">
          <div className="status-indicator">
            <span className="status-dot" />
            <span className="status-text">Connected</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
        }

        .navbar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 var(--space-lg);
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Brand */
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          font-size: var(--font-base);
        }

        .brand-icon {
          font-size: 18px;
        }

        .brand-text {
          color: var(--text-primary);
        }

        .brand-accent {
          color: var(--accent-blue);
        }

        /* Navigation */
        .navbar-nav {
          display: flex;
          gap: var(--space-xs);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          font-size: var(--font-sm);
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .nav-item.active {
          color: var(--text-primary);
          background: var(--bg-active);
        }

        /* Right */
        .navbar-right {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-xs) var(--space-sm);
          background: rgba(34, 197, 94, 0.1);
          border-radius: 100px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: var(--accent-green);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-text {
          font-size: var(--font-xs);
          color: var(--accent-green);
          font-weight: 500;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .nav-item span {
            display: none;
          }

          .status-text {
            display: none;
          }
        }
      `}</style>
    </nav>
  )
}