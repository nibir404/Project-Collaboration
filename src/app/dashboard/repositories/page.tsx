import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

async function getRepositories(orgId: string) {
  return prisma.repository.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { activities: true },
      },
    },
  })
}

async function getActivityCounts(orgId: string) {
  const repos = await prisma.repository.findMany({
    where: { orgId },
    select: {
      id: true,
      fullName: true,
    },
  })
  
  const counts: Record<string, { pushes: number; prs: number; issues: number }> = {}
  
  for (const repo of repos) {
    const [pushes, prs, issues] = await Promise.all([
      prisma.activity.count({ where: { repoId: repo.id, type: 'push' } }),
      prisma.activity.count({ where: { repoId: repo.id, type: 'pull_request' } }),
      prisma.activity.count({ where: { repoId: repo.id, type: 'issue' } }),
    ])
    counts[repo.id] = { pushes, prs, issues }
  }
  
  return counts
}

export default async function RepositoriesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.orgId) {
    redirect('/auth/signin')
  }
  
  const [repositories, activityCounts] = await Promise.all([
    getRepositories(session.user.orgId),
    getActivityCounts(session.user.orgId),
  ])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Repositories</h1>
              <p className="mt-1 text-gray-600">
                Repositories being tracked by your organization
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ⚙️ Configure Webhook
            </Link>
          </div>
        </div>
        
        {/* Repositories Grid */}
        {repositories.length === 0 ? (
          <div className="rounded-2xl border bg-white p-12 text-center shadow-sm animate-slide-up">
            <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <span className="text-4xl">📚</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">No Repositories Yet</h2>
            <p className="mt-2 text-gray-600 max-w-sm mx-auto">
              Add a webhook to your GitHub repositories to start tracking activities
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {repositories.map((repo, index) => {
              const counts = activityCounts[repo.id] || { pushes: 0, prs: 0, issues: 0 }
              return (
                <div
                  key={repo.id}
                  className="group rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-primary-200 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl">
                      📁
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                        {repo.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{repo.fullName}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">{counts.pushes}</p>
                      <p className="text-xs text-gray-500">Pushes</p>
                    </div>
                    <div className="text-center border-l border-r border-gray-100">
                      <p className="text-xl font-bold text-blue-600">{counts.prs}</p>
                      <p className="text-xs text-gray-500">PRs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-purple-600">{counts.issues}</p>
                      <p className="text-xs text-gray-500">Issues</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Link
                      href={`/dashboard/activities?repo=${repo.fullName}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      View activities
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
