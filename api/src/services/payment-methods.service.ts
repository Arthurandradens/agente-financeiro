import { eq } from 'drizzle-orm'
import { paymentMethods } from '../schema/payment-methods'
import type { FastifyInstance } from 'fastify'

export interface PaymentMethod {
  id: number
  code: string
  label: string
  aliases?: string
}

export class PaymentMethodsService {
  constructor(private fastify: FastifyInstance) {}

  async list(): Promise<PaymentMethod[]> {
    const db = this.fastify.db
    const result = await db.select({
      id: paymentMethods.id,
      code: paymentMethods.code,
      label: paymentMethods.label,
      aliases: paymentMethods.aliases
    })
    .from(paymentMethods)
    .orderBy(paymentMethods.label)

    return result
  }

  async getById(id: number): Promise<PaymentMethod | null> {
    const db = this.fastify.db
    const result = await db.select({
      id: paymentMethods.id,
      code: paymentMethods.code,
      label: paymentMethods.label,
      aliases: paymentMethods.aliases
    })
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .limit(1)

    return result[0] || null
  }

  async getByCode(code: string): Promise<PaymentMethod | null> {
    const db = this.fastify.db
    const result = await db.select({
      id: paymentMethods.id,
      code: paymentMethods.code,
      label: paymentMethods.label,
      aliases: paymentMethods.aliases
    })
    .from(paymentMethods)
    .where(eq(paymentMethods.code, code))
    .limit(1)

    return result[0] || null
  }
}
