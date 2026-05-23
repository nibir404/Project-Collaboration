import Link from 'next/link'
import { ArrowRight, Activity, Shield, Zap } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Activity,
      title: 'Real-time Activity',
      description:
        'Receive webhooks from GitHub instantly. Track pushes, PRs, issues, and more as they happen.',
    },
    {
      icon: Shield,
      title: 'Organization Scoped',
      description:
        'Each organization only sees their own activities. Complete data isolation built-in.',
    },
    {
      icon: Zap,
      title: 'Webhook Management',
      description:
        'Auto-generated secrets with easy regeneration. Secure HMAC verification.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#262626] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold">
            <span className="text-xl">⚡</span>
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Activity Tracker
            </span>
          </Link>
          <div className="flex gap-2">
            <Link
              href="/auth/signin"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signin"
              className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#111] px-4 py-1.5 text-sm text-zinc-400">
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
            New
          </span>
          <span>Track GitHub activities in real-time</span>
        </div>

        <h1 className="mb-6 text-center text-5xl font-bold tracking-tight md:text-7xl">
          Monitor your team's
          <br />
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            GitHub Activity
          </span>
        </h1>

        <p className="mb-10 max-w-lg text-center text-lg text-zinc-400">
          Get instant visibility into pushes, pull requests, issues, and more.
          <br />
          Organize activities by team and repository.
        </p>

        <div className="mb-16 flex gap-4">
          <Link
            href="/auth/signin"
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-base font-medium text-white hover:bg-blue-600"
          >
            Start Tracking
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="flex items-center gap-8 rounded-lg border border-[#262626] bg-[#111] p-6">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">50K+</span>
            <span className="text-sm text-zinc-500">Events/day</span>
          </div>
          <div className="h-10 w-px bg-[#262626]" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">10ms</span>
            <span className="text-sm text-zinc-500">Latency</span>
          </div>
          <div className="h-10 w-px bg-[#262626]" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">99.9%</span>
            <span className="text-sm text-zinc-500">Uptime</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[#262626] bg-[#111] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold">Everything you need</h2>
          <p className="mb-12 text-center text-lg text-zinc-400">
            Powerful features to track and manage your GitHub activities.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#262626] bg-[#0a0a0a] p-6 transition hover:border-zinc-700"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <feature.icon size={24} />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#262626] px-6 py-10">
        <div className="mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-xl">⚡</span>
            <span>Activity Tracker</span>
          </div>
          <p className="text-sm text-zinc-500">Built with Next.js, Prisma & Tailwind</p>
          <p className="text-xs text-zinc-600">© 2026. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}