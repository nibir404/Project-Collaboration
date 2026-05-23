import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import ActivityCard from '@/components/ActivityCard'
import { GitBranch, GitPullRequest, CircleDot, Folder } from 'lucide-react'

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

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="header-title">Dashboard</h1>
            <p className="header-subtitle">
              Welcome back, {session.user.name || session.user.email}
            </p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <CircleDot size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalActivities}</span>
              <span className="stat-label">Total Activities</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <GitBranch size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.pushCount}</span>
              <span className="stat-label">Push Events</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <GitPullRequest size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.prCount}</span>
              <span className="stat-label">Pull Requests</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <Folder size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.repoCount}</span>
              <span className="stat-label">Repositories</span>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="activity-section">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
            <Link href="/dashboard/activities" className="section-link">
              View all →
            </Link>
          </div>

          {activities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3 className="empty-title">No activities yet</h3>
              <p className="empty-description">
                Set up your webhook in Settings to start tracking GitHub events.
              </p>
              <Link href="/dashboard/settings" className="btn btn-primary">
                Setup Webhook
              </Link>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .dashboard-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: calc(60px + var(--space-2xl)) var(--space-lg) var(--space-2xl);
        }

        /* Header */
        .dashboard-header {
          margin-bottom: var(--space-2xl);
        }

        .header-title {
          font-size: var(--font-3xl);
          font-weight: 700;
          margin-bottom: var(--space-xs);
        }

        .header-subtitle {
          font-size: var(--font-base);
          color: var(--text-secondary);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-md);
          margin-bottom: var(--space-2xl);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-lg);
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-blue);
          border-radius: var(--radius-md);
        }

        .stat-icon.green {
          background: rgba(34, 197, 94, 0.15);
          color: var(--accent-green);
        }

        .stat-icon.purple {
          background: rgba(168, 85, 247, 0.15);
          color: var(--accent-purple);
        }

        .stat-icon.orange {
          background: rgba(249, 115, 22, 0.15);
          color: var(--accent-orange);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: var(--font-2xl);
          font-weight: 700;
        }

        .stat-label {
          font-size: var(--font-sm);
          color: var(--text-secondary);
        }

        /* Activity Section */
        .activity-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-lg);
          border-bottom: 1px solid var(--border-subtle);
        }

        .section-title {
          font-size: var(--font-lg);
          font-weight: 600;
        }

        .section-link {
          font-size: var(--font-sm);
          color: var(--accent-blue);
        }

        .section-link:hover {
          text-decoration: underline;
        }

        /* Empty State */
        .empty-state {
          padding: var(--space-3xl);
          text-align: center;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: var(--space-md);
        }

        .empty-title {
          font-size: var(--font-lg);
          font-weight: 600;
          margin-bottom: var(--space-sm);
        }

        .empty-description {
          font-size: var(--font-base);
          color: var(--text-secondary);
          margin-bottom: var(--space-lg);
        }

        /* Activity List */
        .activity-list {
          divide-y: 1px solid var(--border-subtle);
        }
      `}</style>
    </div>
  )
}