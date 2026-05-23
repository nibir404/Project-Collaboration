import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const webhookSecret = crypto.randomBytes(32).toString('hex')
    
    const organization = await prisma.organization.update({
      where: { id: session.user.orgId },
      data: { webhookSecret },
    })
    
    return NextResponse.json({ 
      webhookSecret: organization.webhookSecret,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/github`
    })
  } catch (error) {
    console.error('Error regenerating webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
