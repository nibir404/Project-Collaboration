import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import ActivityCard from '@/components/ActivityCard'
import StatCard from '@/components/StatCard'
import Link from 'next/link'

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

async function getRecentActivityByType(orgId: string) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const activities = await prisma.activity.findMany({
    where: { orgId, createdAt: { gte: sevenDaysAgo } },
    select: { type: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  
  return activities.length
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.orgId) {
    redirect('/auth/signin')
  }
  
  const [activities, stats, recentCount] = await Promise.all([
    getActivities(session.user.orgId),
    getStats(session.user.orgId),
    getRecentActivityByType(session.user.orgId),
  ])
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <StatCard
            title="Total Activities"
            value={stats.totalActivities}
            icon="📊"
          />
          <StatCard
            title="Push Events"
            value={stats.pushCount}
            icon="📤"
          />
          <StatCard
            title="Pull Requests"
            value={stats.prCount}
            icon="🔀"
          />
          <StatCard
            title="Repositories"
            value={stats.repoCount}
            icon="📚"
          />
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
              <Link
                href="/dashboard/activities"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all →
              </Link>
            </div>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-4">📭</p>
                <p>No activities yet</p>
                <p className="text-sm mt-1">
                  Set up your webhook in Settings to start tracking
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </div>
          
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Activity This Week
            </h2>
            <div className="text-center py-8">
              <p className="text-5xl font-bold text-blue-600">{recentCount}</p>
              <p className="text-gray-500 mt-2">activities in the last 7 days</p>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pushes</span>
                <span className="font-medium">{stats.pushCount}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalActivities > 0 ? (stats.pushCount / stats.totalActivities) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pull Requests</span>
                <span className="font-medium">{stats.prCount}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${stats.totalActivities > 0 ? (stats.prCount / stats.totalActivities) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
