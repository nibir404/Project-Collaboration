import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import {
  verifyGitHubWebhook,
  parseActivityFromEvent,
} from './github-webhook'

describe('verifyGitHubWebhook', () => {
  const secret = 'test-webhook-secret'
  
  it('should return true for valid signature', () => {
    const payload = JSON.stringify({ action: 'push' })
    const hmac = crypto.createHmac('sha256', secret)
    const signature = 'sha256=' + hmac.update(payload).digest('hex')
    
    expect(verifyGitHubWebhook(payload, signature, secret)).toBe(true)
  })

  it('should return false for invalid signature (different length)', () => {
    const payload = JSON.stringify({ action: 'push' })
    // signature with different length won't throw due to early return
    const signature = 'sha256=short'
    
    expect(verifyGitHubWebhook(payload, signature, secret)).toBe(false)
  })

  it('should return false for null signature', () => {
    expect(verifyGitHubWebhook('payload', null, secret)).toBe(false)
  })
})

describe('parseActivityFromEvent', () => {
  describe('push events', () => {
    it('should parse push event correctly', () => {
      const payload = {
        ref: 'refs/heads/main',
        before: 'abc123',
        after: 'def456',
        repository: {
          id: 1,
          name: 'repo',
          full_name: 'owner/repo',
          html_url: 'https://github.com/owner/repo',
        },
        pusher: { name: 'user1', email: 'user@test.com' },
        sender: { login: 'user1', avatar_url: 'https://avatar.url' },
        commits: [
          { id: 'commit1', message: 'fix: bug', author: { name: 'User', email: 'user@test.com' } },
        ],
      }

      const result = parseActivityFromEvent('push', payload)
      
      expect(result).toMatchObject({
        type: 'push',
        action: null,
        repoName: 'owner/repo',
        actor: 'user1',
        actorAvatar: 'https://avatar.url',
        commitSha: 'commit1',
        branch: 'main',
      })
    })

    it('should extract branch from ref', () => {
      const payload = {
        ref: 'refs/heads/feature/my-branch',
        repository: { full_name: 'owner/repo' },
        commits: [],
      }

      const result = parseActivityFromEvent('push', payload)
      expect(result?.branch).toBe('feature/my-branch')
    })
  })

  describe('pull_request events', () => {
    it('should parse pull_request event correctly', () => {
      const payload = {
        action: 'opened',
        number: 42,
        pull_request: {
          id: 1,
          title: 'Add feature',
          state: 'open',
          merged: false,
          user: { login: 'pr-author', avatar_url: 'https://avatar.url' },
          head: { ref: 'feature', sha: 'sha123' },
          base: { ref: 'main' },
        },
        repository: { name: 'repo', full_name: 'owner/repo' },
        sender: { login: 'pr-author', avatar_url: 'https://avatar.url' },
      }

      const result = parseActivityFromEvent('pull_request', payload)
      
      expect(result).toMatchObject({
        type: 'pull_request',
        action: 'opened',
        repoName: 'owner/repo',
        actor: 'pr-author',
        commitSha: 'sha123',
        branch: 'feature',
      })
    })
  })

  describe('issues events', () => {
    it('should parse issues event correctly', () => {
      const payload = {
        action: 'opened',
        issue: {
          id: 1,
          number: 15,
          title: 'Bug report',
          state: 'open',
          user: { login: 'reporter', avatar_url: 'https://avatar.url' },
        },
        repository: { name: 'repo', full_name: 'owner/repo' },
        sender: { login: 'reporter', avatar_url: 'https://avatar.url' },
      }

      const result = parseActivityFromEvent('issues', payload)
      
      expect(result).toMatchObject({
        type: 'issue',
        action: 'opened',
        repoName: 'owner/repo',
        actor: 'reporter',
        commitSha: null,
        branch: null,
      })
    })
  })

  describe('unsupported events', () => {
    it('should return null for unsupported event types', () => {
      const result = parseActivityFromEvent('workflow_run', {})
      expect(result).toBeNull()
    })

    it('should return null for malformed payloads', () => {
      const result = parseActivityFromEvent('push', null)
      expect(result).toBeNull()
    })
  })
})