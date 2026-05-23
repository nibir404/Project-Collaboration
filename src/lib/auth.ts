import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo read:org',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' && profile) {
        const githubProfile = profile as { login: string; id: number }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { organization: true },
        })

        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              githubUserId: String(githubProfile.id),
            },
          })

          if (newUser) {
            const org = await prisma.organization.create({
              data: {
                name: `${githubProfile.login}'s Organization`,
                slug: githubProfile.login.toLowerCase(),
                githubOrgId: String(githubProfile.id),
              },
            })

            await prisma.user.update({
              where: { id: newUser.id },
              data: { organization: { connect: { id: org.id } } },
            })
          }
        } else if (!existingUser.githubUserId) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { githubUserId: String(githubProfile.id) },
          })
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { organization: true },
        })

        if (dbUser) {
          session.user.id = dbUser.id
          session.user.orgId = dbUser.orgId
          session.user.org = dbUser.organization
          session.user.role = dbUser.role
        }
      }
      return session
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.githubUsername = (profile as { login: string }).login
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
  },
}