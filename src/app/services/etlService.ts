import { fetchAllTraits, fetchAllPRSModelsIncremental, fetchAllPublicationsIncremental} from './externalApi'
import { transformAllTraits, transformPRSModel, transformPublication} from './transformer'
import { insertTrait, insertPRSModel, insertPublication } from '../repositories/insertData'

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



export async function runPRSModelETL() {
  await fetchAllPRSModelsIncremental(async (batch) => {
    const transformed = batch.map(transformPRSModel)

    for (const model of transformed) {
      try {
        await insertPRSModel(model)
        console.log(`✅ PRS Model insertado: ${model.pgscId}`)
      } catch (err) {
        console.error(`❌ Error al insertar modelo ${model.pgscId}:`, err)
      }
    }
  })
}



export async function runPublicationETL() {
  await fetchAllPublicationsIncremental(async (batch) => {
    const transformed = batch.map(transformPublication)

    for (const pub of transformed) {
      try {
        await insertPublication(pub)
        console.log(`✅ Publicación insertada: ${pub.pgpId}`)
      } catch (err) {
        console.error(`❌ Error al insertar publicación ${pub.pgpId}:`, err)
      }
    }
  })
}
