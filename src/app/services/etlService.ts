import { fetchAllTraits } from './externalApi'
import { transformAllTraits } from './transformer'
import { insertTrait } from '../repositories/insertData'



export async function runTraitETL() {
    const rawTraits = await fetchAllTraits()
    const transformed = transformAllTraits(rawTraits)
  
    const inserted = []

  for (const trait of transformed) {
    try {
      const result = await insertTrait(trait)
      inserted.push(result)
    } catch (error) {
      console.error(`❌ Error al insertar trait ${trait.label}:`, error)
    }
  }

  console.log(`✔️ Se insertaron ${inserted.length} traits`)
  return inserted
}


import { fetchAllTraitCategories } from './externalApi'
import { transformAllTraitCategories } from './transformer'
import { insertTraitCategoryWithRelations } from '../repositories/insertData'

export async function runTraitCategoryETL() {
  const raw = await fetchAllTraitCategories()
  const transformed = transformAllTraitCategories(raw)

  for (const category of transformed) {
    await insertTraitCategoryWithRelations(category)
    console.log(`✅ Categoría insertada: ${category.label}`)
  }

  console.log(`🎉 ETL completa: ${transformed.length} categorías procesadas.`)
}