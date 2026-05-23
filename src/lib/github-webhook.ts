import crypto from 'crypto'

export function verifyGitHubWebhook(
  payload: string | Buffer,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  const hmac = crypto.createHmac('sha256', secret)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export type GitHubEventType =
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'issue_comment'
  | 'create'
  | 'delete'
  | 'fork'
  | 'watch'
  | 'release'
  | 'workflow_run'
  | 'check_run'
  | 'check_suite'
  | '*'

export interface GitHubPushPayload {
  ref: string
  before: string
  after: string
  repository: {
    id: number
    name: string
    full_name: string
    html_url: string
  }
  pusher: {
    name: string
    email: string
  }
  sender: {
    login: string
    avatar_url: string
  }
  commits: Array<{
    id: string
    message: string
    author: { name: string; email: string }
  }>
}

export interface GitHubPullRequestPayload {
  action: string
  number: number
  pull_request: {
    id: number
    title: string
    state: string
    merged: boolean
    user: {
      login: string
      avatar_url: string
    }
    head: { ref: string; sha: string }
    base: { ref: string }
  }
  repository: {
    id: number
    name: string
    full_name: string
  }
  sender: {
    login: string
    avatar_url: string
  }
}

export interface GitHubIssuesPayload {
  action: string
  issue: {
    id: number
    number: number
    title: string
    state: string
    user: {
      login: string
      avatar_url: string
    }
  }
  repository: {
    id: number
    name: string
    full_name: string
  }
  sender: {
    login: string
    avatar_url: string
  }
}

export function parseActivityFromEvent(
  eventType: string,
  payload: unknown
): {
  type: string
  action: string | null
  repoName: string
  actor: string
  actorAvatar: string | null
  commitSha: string | null
  branch: string | null
  payloadJson: string
} | null {
  try {
    switch (eventType) {
      case 'push': {
        const p = payload as GitHubPushPayload
        const branch = p.ref?.replace('refs/heads/', '') || 'unknown'
        const latestCommit = p.commits?.[p.commits.length - 1]
        return {
          type: 'push',
          action: null,
          repoName: p.repository?.full_name || 'unknown',
          actor: p.pusher?.name || p.sender?.login || 'unknown',
          actorAvatar: p.sender?.avatar_url || null,
          commitSha: latestCommit?.id || p.after,
          branch,
          payloadJson: JSON.stringify({ count: p.commits?.length || 0 }),
        }
      }
      case 'pull_request': {
        const p = payload as GitHubPullRequestPayload
        return {
          type: 'pull_request',
          action: p.action,
          repoName: p.repository?.full_name || 'unknown',
          actor: p.pull_request?.user?.login || p.sender?.login || 'unknown',
          actorAvatar: p.pull_request?.user?.avatar_url || p.sender?.avatar_url || null,
          commitSha: p.pull_request?.head?.sha || null,
          branch: p.pull_request?.head?.ref || null,
          payloadJson: JSON.stringify({
            number: p.number,
            title: p.pull_request?.title,
            state: p.pull_request?.state,
            merged: p.pull_request?.merged,
          }),
        }
      }
      case 'issues': {
        const p = payload as GitHubIssuesPayload
        return {
          type: 'issue',
          action: p.action,
          repoName: p.repository?.full_name || 'unknown',
          actor: p.issue?.user?.login || p.sender?.login || 'unknown',
          actorAvatar: p.issue?.user?.avatar_url || p.sender?.avatar_url || null,
          commitSha: null,
          branch: null,
          payloadJson: JSON.stringify({
            number: p.issue?.number,
            title: p.issue?.title,
            state: p.issue?.state,
          }),
        }
      }
      default:
        return null
    }
  } catch {
    return null
  }
}