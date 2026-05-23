import Link from 'next/link'

export default function ErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-3xl font-bold text-gray-900">Authentication Error</h1>
        <p className="mt-2 text-gray-600">
          There was an error during authentication. Please try again.
        </p>
        <Link
          href="/auth/signin"
          className="mt-8 inline-block rounded-md bg-black px-6 py-3 text-white font-medium hover:bg-gray-800"
        >
          Try Again
        </Link>
      </div>
    </main>
  )
}
