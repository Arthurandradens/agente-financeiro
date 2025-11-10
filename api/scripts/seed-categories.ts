import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { categories, transactions } from '../src/schema/index'
import { sql } from 'drizzle-orm'
import { config } from '../src/config/env'

// Conectar ao banco PostgreSQL
const pool = new Pool({
  connectionString: config.DATABASE_URL
})
const db = drizzle(pool)

interface CategoryData {
  name: string
  slug: string
  kind: 'spend' | 'income' | 'transfer' | 'invest' | 'fee'
  parentId?: number
}

// Função para gerar slug a partir do nome
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim()
}

// Função para inferir o tipo de categoria
function inferCategoryKind(categoryName: string, subcategoryName?: string): 'spend' | 'income' | 'transfer' | 'invest' | 'fee' {
  const cat = categoryName.toLowerCase()
  const sub = (subcategoryName || '').toLowerCase()
  
  if (cat.includes('transferência') || cat.includes('transferencia')) {
    return 'transfer'
  }
  
  if (cat.includes('investimento') || cat.includes('investimentos')) {
    return 'invest'
  }
  
  if (cat.includes('serviços financeiros') || cat.includes('servicos financeiros') || 
      sub.includes('tarifa') || sub.includes('taxa')) {
    return 'fee'
  }
  
  // Para categorias de crédito (entradas), assumir income
  // Para categorias de débito (gastos), assumir spend
  return 'spend'
}

async function seedCategories() {
  console.log('🌱 Iniciando seed de categorias...')
  
  try {
    // Buscar todas as categorias e subcategorias únicas das transações
    const uniqueCategories = await db
      .selectDistinct({ 
        categoria: transactions.categoria,
        subcategoria: transactions.subcategoria 
      })
      .from(transactions)
      .where(sql`${transactions.categoria} IS NOT NULL`)
    
    console.log(`📊 Encontradas ${uniqueCategories.length} combinações categoria/subcategoria`)
    
    // Criar mapa de categorias pai
    const parentCategories = new Map<string, CategoryData>()
    const subcategories = new Map<string, CategoryData>()
    
    for (const row of uniqueCategories) {
      const categoryName = row.categoria
      const subcategoryName = row.subcategoria
      
      // Adicionar categoria pai se não existir
      if (!parentCategories.has(categoryName)) {
        parentCategories.set(categoryName, {
          name: categoryName,
          slug: generateSlug(categoryName),
          kind: inferCategoryKind(categoryName)
        })
      }
      
      // Adicionar subcategoria se existir
      if (subcategoryName && !subcategories.has(`${categoryName}|||${subcategoryName}`)) {
        subcategories.set(`${categoryName}|||${subcategoryName}`, {
          name: subcategoryName,
          slug: generateSlug(`${categoryName}-${subcategoryName}`),
          kind: inferCategoryKind(categoryName, subcategoryName)
        })
      }
    }
    
    console.log(`📁 Categorias pai: ${parentCategories.size}`)
    console.log(`📁 Subcategorias: ${subcategories.size}`)
    
    // Inserir categorias pai
    const insertedParents = new Map<string, number>()
    
    for (const [categoryName, categoryData] of parentCategories) {
      try {
        const [inserted] = await db
          .insert(categories)
          .values(categoryData)
          .returning({ id: categories.id })
        
        insertedParents.set(categoryName, inserted.id)
        console.log(`✅ Categoria pai inserida: ${categoryName} (ID: ${inserted.id})`)
      } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          // Categoria já existe, buscar ID
          const existing = await db
            .select({ id: categories.id })
            .from(categories)
            .where(sql`${categories.slug} = ${categoryData.slug}`)
            .limit(1)
          
          if (existing.length > 0) {
            insertedParents.set(categoryName, existing[0].id)
            console.log(`⚠️  Categoria pai já existe: ${categoryName} (ID: ${existing[0].id})`)
          }
        } else {
          throw error
        }
      }
    }
    
    // Inserir subcategorias
    for (const [key, subcategoryData] of subcategories) {
      const [categoryName, subcategoryName] = key.split('|||')
      const parentId = insertedParents.get(categoryName)
      
      if (!parentId) {
        console.log(`⚠️  Categoria pai não encontrada para subcategoria: ${subcategoryName}`)
        continue
      }
      
      try {
        const [inserted] = await db
          .insert(categories)
          .values({
            ...subcategoryData,
            parentId
          })
          .returning({ id: categories.id })
        
        console.log(`✅ Subcategoria inserida: ${subcategoryName} (ID: ${inserted.id}, Pai: ${categoryName})`)
      } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          console.log(`⚠️  Subcategoria já existe: ${subcategoryName}`)
        } else {
          throw error
        }
      }
    }
    
    console.log('🎉 Seed de categorias concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro durante seed de categorias:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Executar se chamado diretamente
if (process.argv[1] && process.argv[1].includes('seed-categories.ts')) {
  console.log('🚀 Iniciando seed de categorias...')
  seedCategories()
    .then(() => {
      console.log('✅ Script finalizado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro:', error)
      process.exit(1)
    })
}

export { seedCategories }
