import {config} from 'dotenv'
config()
import { Elysia } from 'elysia'
import { prisma } from './lib/prisma'

const app = new Elysia()
  .get('/', () => 'Hello Elysia')
  .get('/users', async () => {
    const users = await prisma.user.findMany()
    return users
  })
  .post('/users', async ({ body }) => {
    const user = await prisma.user.create({
      data: body as any
    })
    return user
  })
  .listen(process.env.APP_PORT || 3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
