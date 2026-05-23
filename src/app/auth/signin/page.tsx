import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SignInButton from './SignInButton'

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#262626] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold">
            <span className="text-xl">⚡</span>
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Activity Tracker
            </span>
          </Link>
        </div>
      </nav>

      {/* Sign In Container */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-xl border border-[#262626] bg-[#111] p-10">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold">Welcome back</h1>
            <p className="text-zinc-400">Sign in to access your activity dashboard</p>
          </div>

          <div className="flex flex-col gap-4">
            <SignInButton />
            <p className="text-center text-xs text-zinc-500">
              We'll redirect you to GitHub to authorize.
            </p>
          </div>
        </div>

        <Link href="/" className="mt-8 text-sm text-zinc-400 hover:text-white">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}