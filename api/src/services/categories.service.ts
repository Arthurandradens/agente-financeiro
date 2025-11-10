import { eq, and, sql } from 'drizzle-orm'
import { categories } from '../schema/index'
import type { FastifyInstance } from 'fastify'

export interface CategoryListResult {
  items: any[]
  total: number
}

export interface CategoryHierarchy {
  id: number
  name: string
  slug: string
  kind: string
  parentId?: number
  children?: CategoryHierarchy[]
}

export class CategoriesService {
  constructor(private fastify: FastifyInstance) {}

  async list(): Promise<CategoryListResult> {
    const db = this.fastify.db

    // Buscar todas as categorias
    const items = await db.select().from(categories).orderBy(categories.name)

    return {
      items,
      total: items.length
    }
  }

  async getHierarchy(): Promise<CategoryHierarchy[]> {
    const db = this.fastify.db

    // Buscar todas as categorias
    const allCategories = await db.select().from(categories).orderBy(categories.name)

    // Criar mapa para facilitar lookup
    const categoryMap = new Map<number, CategoryHierarchy>()
    const roots: CategoryHierarchy[] = []

    // Primeiro, criar todos os nós
    for (const cat of allCategories) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        kind: cat.kind,
        parentId: cat.parentId || undefined,
        children: []
      })
    }

    // Depois, organizar hierarquia
    for (const cat of allCategories) {
      const category = categoryMap.get(cat.id)!
      
      if (cat.parentId) {
        // É subcategoria
        const parent = categoryMap.get(cat.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(category)
        }
      } else {
        // É categoria pai
        roots.push(category)
      }
    }

    return roots
  }

  async getById(id: number) {
    const db = this.fastify.db
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
    return result.length > 0 ? result[0] : null
  }

  async create(data: {
    name: string
    slug: string
    kind: 'spend' | 'income' | 'transfer' | 'invest' | 'fee'
    parentId?: number
  }) {
    const db = this.fastify.db

    // Verificar se slug já existe
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, data.slug))
      .limit(1)

    if (existing.length > 0) {
      throw new Error('Slug já existe')
    }

    // Verificar se parentId existe (se fornecido)
    if (data.parentId) {
      const parent = await this.getById(data.parentId)
      if (!parent) {
        throw new Error('Categoria pai não encontrada')
      }
    }

    const [inserted] = await db.insert(categories).values(data).returning()
    return inserted
  }

  async update(id: number, data: Partial<{
    name: string
    slug: string
    kind: 'spend' | 'income' | 'transfer' | 'invest' | 'fee'
    parentId: number
  }>) {
    const db = this.fastify.db

    // Verificar se categoria existe
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Categoria não encontrada')
    }

    // Verificar se slug já existe (se mudou)
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, data.slug))
        .limit(1)

      if (slugExists.length > 0) {
        throw new Error('Slug já existe')
      }
    }

    // Verificar se parentId existe (se fornecido)
    if (data.parentId !== undefined) {
      if (data.parentId !== null) {
        const parent = await this.getById(data.parentId)
        if (!parent) {
          throw new Error('Categoria pai não encontrada')
        }
      }
    }

    const [updated] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning()

    return updated
  }

  async delete(id: number) {
    const db = this.fastify.db

    // Verificar se categoria existe
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Categoria não encontrada')
    }

    // Verificar se tem subcategorias
    const children = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, id))
      .limit(1)

    if (children.length > 0) {
      throw new Error('Não é possível excluir categoria que tem subcategorias')
    }

    // Verificar se tem transações associadas
    const transactions = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM transactions 
      WHERE category_id = ${id} OR subcategory_id = ${id}
    `)

    if (Number(transactions.rows[0].count) > 0) {
      throw new Error('Não é possível excluir categoria que tem transações associadas')
    }

    await db.delete(categories).where(eq(categories.id, id))
    return true
  }
}

