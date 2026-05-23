'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WebhookSetup({
  webhookSecret,
  orgId,
}: {
  webhookSecret: string | null | undefined
  orgId: string
}) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [localSecret, setLocalSecret] = useState(webhookSecret)
  
  const generateNewSecret = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/organization/regenerate-webhook', {
        method: 'POST',
      })
      const data = await res.json()
      setLocalSecret(data.webhookSecret)
      router.refresh()
    } catch (error) {
      console.error('Error generating secret:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }
  
  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        GitHub Webhook Setup
      </h2>
      <p className="text-gray-600 mb-6">
        To receive GitHub events, add this webhook to your GitHub repositories or organization.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Webhook URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/github`}
              className="flex-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono"
            />
            <button
              onClick={() => copyToClipboard(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/github`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Copy
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Webhook Secret
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              readOnly
              value={localSecret || ''}
              placeholder="Generate a secret to enable webhook"
              className="flex-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono"
            />
            <button
              onClick={() => localSecret && copyToClipboard(localSecret)}
              disabled={!localSecret}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Copy
            </button>
            <button
              onClick={generateNewSecret}
              disabled={isGenerating}
              className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="font-medium text-gray-900 mb-2">Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Go to your GitHub repository or organization settings</li>
            <li>Navigate to Webhooks → Add webhook</li>
            <li>Enter the Webhook URL above</li>
            <li>Set Content type to <code className="bg-gray-100 px-1 rounded">application/json</code></li>
            <li>Enter the Webhook Secret above</li>
            <li>Select events: Push, Pull requests, Issues, and other activities</li>
            <li>Enable SSL verification if available</li>
            <li>Save the webhook</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
