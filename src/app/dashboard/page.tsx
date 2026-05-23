import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import {
  GitBranch,
  GitPullRequest,
  CircleDot,
  Folder,
  ExternalLink,
} from 'lucide-react'

async function getActivities(orgId: string) {
  return prisma.activity.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { repository: true },
  })
}

async function getStats(orgId: string) {
  const [totalActivities, pushCount, prCount, repoCount] = await Promise.all([
    prisma.activity.count({ where: { orgId } }),
    prisma.activity.count({ where: { orgId, type: 'push' } }),
    prisma.activity.count({ where: { orgId, type: 'pull_request' } }),
    prisma.repository.count({ where: { orgId } }),
  ])

  return { totalActivities, pushCount, prCount, repoCount }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.orgId) {
    redirect('/auth/signin')
  }

  const [activities, stats] = await Promise.all([
    getActivities(session.user.orgId),
    getStats(session.user.orgId),
  ])

  const statCards = [
    { label: 'Total Activities', value: stats.totalActivities, icon: CircleDot, color: 'blue' },
    { label: 'Push Events', value: stats.pushCount, icon: GitBranch, color: 'green' },
    { label: 'Pull Requests', value: stats.prCount, icon: GitPullRequest, color: 'purple' },
    { label: 'Repositories', value: stats.repoCount, icon: Folder, color: 'orange' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-24">
        {/* Header */}
        <header className="mb-10">
          <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
          <p className="text-zinc-400">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </header>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-[#262626] bg-[#111] p-5"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                  stat.color === 'blue'
                    ? 'bg-blue-500/10 text-blue-400'
                    : stat.color === 'green'
                    ? 'bg-green-500/10 text-green-400'
                    : stat.color === 'purple'
                    ? 'bg-purple-500/10 text-purple-400'
                    : 'bg-orange-500/10 text-orange-400'
                }`}
              >
                <stat.icon size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-sm text-zinc-500">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="overflow-hidden rounded-lg border border-[#262626] bg-[#111]">
          <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link href="/dashboard/activities" className="text-sm text-blue-400 hover:underline">
              View all →
            </Link>
          </div>

          {activities.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-4 text-5xl">📭</div>
              <h3 className="mb-2 text-lg font-semibold">No activities yet</h3>
              <p className="mb-6 text-zinc-400">
                Set up your webhook in Settings to start tracking GitHub events.
              </p>
              <Link
                href="/dashboard/settings"
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                Setup Webhook
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#262626]">
              {activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-[#1a1a1a]"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      activity.type === 'push'
                        ? 'bg-green-500/10 text-green-400'
                        : activity.type === 'pull_request'
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'bg-orange-500/10 text-orange-400'
                    }`}
                  >
                    {activity.type === 'push' ? (
                      <GitBranch size={16} />
                    ) : activity.type === 'pull_request' ? (
                      <GitPullRequest size={16} />
                    ) : (
                      <CircleDot size={16} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-medium">{activity.repoName}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          activity.type === 'push'
                            ? 'bg-green-500/10 text-green-400'
                            : activity.type === 'pull_request'
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-orange-500/10 text-orange-400'
                        }`}
                      >
                        {activity.type === 'pull_request' ? 'PR' : activity.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      <span>{activity.actor}</span>
                      {activity.branch && (
                        <span className="flex items-center gap-1 rounded bg-[#262626] px-1.5 py-0.5 text-xs font-mono">
                          <GitBranch size={10} />
                          {activity.branch}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(activity.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}