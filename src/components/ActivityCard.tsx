'use client'

import Link from 'next/link'
import Image from 'next/image'
import { GitBranch, GitPullRequest, CircleDot, Plus, Minus } from 'lucide-react'

interface Activity {
  id: string
  type: string
  action: string | null
  repoName: string
  actor: string
  actorAvatar: string | null
  commitSha: string | null
  branch: string | null
  createdAt: string
  repository?: {
    id: string
    name: string
    fullName: string
  }
}

interface ActivityCardProps {
  activity: Activity
}

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  push: { icon: GitBranch, color: 'green', label: 'Push' },
  pull_request: { icon: GitPullRequest, color: 'purple', label: 'PR' },
  issue: { icon: CircleDot, color: 'orange', label: 'Issue' },
  create: { icon: Plus, color: 'blue', label: 'Create' },
  delete: { icon: Minus, color: 'red', label: 'Delete' },
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const config = typeConfig[activity.type] || typeConfig.push

  return (
    <div className="activity-card">
      <div className="activity-icon" data-color={config.color}>
        {React.createElement(config.icon, { size: 16 })}
      </div>

      <div className="activity-content">
        <div className="activity-header">
          <span className="activity-repo">{activity.repoName}</span>
          <span className="activity-badge" data-color={config.color}>
            {config.label}
          </span>
        </div>
        <div className="activity-meta">
          <span className="activity-actor">{activity.actor}</span>
          {activity.action && (
            <>
              <span className="activity-action">{activity.action}</span>
            </>
          )}
          {activity.branch && (
            <span className="activity-branch">
              <GitBranch size={12} />
              {activity.branch}
            </span>
          )}
        </div>
      </div>

      <div className="activity-time">
        {new Date(activity.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>

      <style jsx>{`
        .activity-card {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid var(--border-subtle);
          transition: background var(--transition-fast);
        }

        .activity-card:last-child {
          border-bottom: none;
        }

        .activity-card:hover {
          background: var(--bg-hover);
        }

        .activity-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-blue);
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }

        .activity-icon[data-color="green"] {
          background: rgba(34, 197, 94, 0.15);
          color: var(--accent-green);
        }

        .activity-icon[data-color="purple"] {
          background: rgba(168, 85, 247, 0.15);
          color: var(--accent-purple);
        }

        .activity-icon[data-color="orange"] {
          background: rgba(249, 115, 22, 0.15);
          color: var(--accent-orange);
        }

        .activity-icon[data-color="red"] {
          background: rgba(239, 68, 68, 0.15);
          color: var(--accent-red);
        }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-xs);
        }

        .activity-repo {
          font-weight: 600;
          font-size: var(--font-sm);
          color: var(--text-primary);
        }

        .activity-badge {
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-radius: var(--radius-sm);
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-blue);
        }

        .activity-badge[data-color="green"] {
          background: rgba(34, 197, 94, 0.15);
          color: var(--accent-green);
        }

        .activity-badge[data-color="purple"] {
          background: rgba(168, 85, 247, 0.15);
          color: var(--accent-purple);
        }

        .activity-badge[data-color="orange"] {
          background: rgba(249, 115, 22, 0.15);
          color: var(--accent-orange);
        }

        .activity-meta {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          font-size: var(--font-sm);
          color: var(--text-secondary);
        }

        .activity-actor {
          font-weight: 500;
        }

        .activity-action {
          color: var(--text-tertiary);
        }

        .activity-branch {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          font-size: var(--font-xs);
          font-family: monospace;
        }

        .activity-time {
          font-size: var(--font-xs);
          color: var(--text-tertiary);
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}