import path from 'path'
import { fetchAllModelEvaluationsIncremental, fetchAllTraits, fetchAllPRSModelsIncremental, fetchAllPublicationsIncremental, fetchAllTraitCategories, fetchBroadAncestryCategories } from './externalApi'
import { transformEvaluationSample, transformModelEvaluation, transformAllTraits, transformPRSModel, transformPublication, transformAllTraitCategories, extractPRSModelTraitRelations, extractDevelopmentPopulationSamples, transformBroadAncestryCategories } from './transformer'
import { findOrCreateEvaluationSample, insertModelEvaluation, insertTrait, insertPRSModel, insertPublication, insertTraitCategoryWithRelations, connectPRSModelWithTrait, insertDevelopmentPopulationSample, insertBroadAncestryCategory, getBroadAncestryCategoryIdByLabel } from '../repositories/insertData'
import { log } from '../../utils/logging'
import { getBroadAncestryLabelFromRaw, BROAD_ANCESTRY_MAPPING } from '../../utils/broadAncestryMapping'


export async function runTraitETL() {
  const logPath = path.join(process.cwd(), 'data', 'traits_log.txt')
  const rawTraits = await fetchAllTraits()
  const transformed = transformAllTraits(rawTraits)
  const inserted = []

  for (const trait of transformed) {
    try {
      const result = await insertTrait(trait)
      const msg = `✅ Trait insertado: ${result.label}`
      console.log(msg)
      log(logPath, msg)
      inserted.push(result)
    } catch (error) {
      const errorMsg = `❌ Error al insertar trait ${trait.label}: ${error}`
      console.error(errorMsg)
      log(logPath, errorMsg)
    }
  }

  console.log(`✔️ Se insertaron ${inserted.length} traits`)
  return inserted
}

export async function runTraitCategoryETL() {
  const logPath = path.join(process.cwd(), 'data', 'trait_category_log.txt')
  const raw = await fetchAllTraitCategories()
  const transformed = transformAllTraitCategories(raw)

  for (const category of transformed) {
    try {
      await insertTraitCategoryWithRelations(category)
      const msg = `✅ Categoría insertada: ${category.label}`
      console.log(msg)
      log(logPath, msg)
    } catch (error) {
      const errorMsg = `❌ Error al insertar categoría ${category.label}: ${error}`
      console.error(errorMsg)
      log(logPath, errorMsg)
    }
  }

  console.log(`🎉 ETL completa: ${transformed.length} categorías procesadas.`)
}

export async function runPRSModelETL() {
  const logPath = path.join(process.cwd(), 'data', 'prsmodel_log.txt')
  await fetchAllPRSModelsIncremental(async (batch) => {
    const transformed = batch.map(transformPRSModel)

    for (const model of transformed) {
      try {
        await insertPRSModel(model)
        const msg = `✅ PRS Model insertado: ${model.pgscId}`
        console.log(msg)
        log(logPath, msg)
      } catch (err) {
        const errorMsg = `❌ Error al insertar modelo ${model.pgscId}: ${err}`
        console.error(errorMsg)
        log(logPath, errorMsg)
      }
    }
  })
}

export async function runPublicationETL() {
  const logPath = path.join(process.cwd(), 'data', 'publications_log.txt')
  await fetchAllPublicationsIncremental(async (batch) => {
    const transformed = batch.map(transformPublication)

    for (const pub of transformed) {
      try {
        await insertPublication(pub)
        const msg = `✅ Publicación insertada: ${pub.pgpId}`
        console.log(msg)
        log(logPath, msg)
      } catch (err) {
        const errorMsg = `❌ Error al insertar publicación ${pub.pgpId}: ${err}`
        console.error(errorMsg)
        log(logPath, errorMsg)
      }
    }
  })
}

export async function runPRSModelTraitRelationETL() {
  const logPath = path.join(process.cwd(), 'data', 'prsmodel_traits_log.txt')
  await fetchAllPRSModelsIncremental(async (batch) => {
    for (const raw of batch) {
      const { pgscId, traitIds } = extractPRSModelTraitRelations(raw)

      for (const traitId of traitIds) {
        try {
          await connectPRSModelWithTrait(pgscId, traitId)
          const msg = `✅ Relación insertada: ${pgscId} -> ${traitId}`
          console.log(msg)
          log(logPath, msg)
        } catch (err) {
          const errorMsg = `❌ Error en relación ${pgscId} -> ${traitId}: ${err}`
          console.error(errorMsg)
          log(logPath, errorMsg)
        }
      }
    }
  })
}

export async function runDevelopmentSamplesETL() {
  const logPath = path.join(process.cwd(), 'data', 'development_samples_log.txt')
  await fetchAllPRSModelsIncremental(async (batch) => {
    for (const raw of batch) {
      const samples = extractDevelopmentPopulationSamples(raw)

      for (const sample of samples) {
        try {
          //const normalized = normalizeAncestryBroad(sample.ancestryBroad)
          const normalized =sample.ancestryBroad
          const ancestryGroup = BROAD_ANCESTRY_MAPPING[normalized] ?? null

          if (!ancestryGroup) {
            const warningMsg = `⚠️ Ancestría no mapeada para: ${sample.ancestryBroad} (normalizado como '${normalized}') (PRSModel ${sample.pgscId})`
            console.warn(warningMsg)
            log(logPath, warningMsg)
            continue
          }

          const broadAncestryCategoryId = await getBroadAncestryCategoryIdByLabel(ancestryGroup)

          if (!broadAncestryCategoryId) {
            const errorMsg = `❌ No se encontró BroadAncestryCategory con label: ${ancestryGroup} (PRSModel ${sample.pgscId})`
            console.error(errorMsg)
            log(logPath, errorMsg)
            continue
          }

          await insertDevelopmentPopulationSample({ ...sample, broadAncestryCategoryId })
          const msg = `✅ Sample insertado para PRSModel ${sample.pgscId} (${sample.role})`
          console.log(msg)
          log(logPath, msg)
        } catch (err) {
          const errorMsg = `❌ Error al insertar sample para PRSModel ${sample.pgscId}: ${err}`
          console.error(errorMsg)
          log(logPath, errorMsg)
        }
      }
    }
  })
}

export async function runBroadAncestryCategoryETL() {
  const logPath = path.join(process.cwd(), 'data', 'broad_ancestry_category_log.txt')
  const raw = await fetchBroadAncestryCategories()
  const transformed = transformBroadAncestryCategories(raw)

  for (const item of transformed) {
    try {
      await insertBroadAncestryCategory(item)
      const msg = `✅ BroadAncestryCategory insertado: ${item.symbol} (${item.label})`
      console.log(msg)
      log(logPath, msg)
    } catch (err) {
      const errorMsg = `❌ Error al insertar BroadAncestryCategory ${item.symbol}: ${err}`
      console.error(errorMsg)
      log(logPath, errorMsg)
    }
  }
}

export async function runModelEvaluationETL() {
  const logPath = path.join(process.cwd(), 'data', 'modelEvaluation_log.txt')

  await fetchAllModelEvaluationsIncremental(async (batch) => {
    for (const raw of batch) {
      try {
        // Transformar primero
        const evaluationSampleData = transformEvaluationSample(raw)
        //const broadLabel = getBroadAncestryLabelFromRaw(evaluationSampleData.ancestryBroad)
        const normalized =evaluationSampleData.ancestryBroad
        const ancestryGroup = BROAD_ANCESTRY_MAPPING[normalized] ?? null

        if (!ancestryGroup) {
          const warnMsg = `⚠️ No se pudo normalizar la ancestry_broad='${evaluationSampleData.ancestryBroad}' en PPM ID ${raw.id}`
          console.warn(warnMsg)
          log(logPath, warnMsg)
          continue
        }

        const broadAncestryId = await getBroadAncestryCategoryIdByLabel(ancestryGroup)

        if (!broadAncestryId) {
          const warnMsg = `⚠️ No se encontró BroadAncestry para ancestry_broad='${evaluationSampleData.ancestryBroad}' (normalizado: '${broadLabel}') en PPM ID ${raw.id}`
          console.warn(warnMsg)
          log(logPath, warnMsg)
          continue
        }

        // Crear o reutilizar Evaluation Sample
        const evaluationSample = await findOrCreateEvaluationSample({
          ...evaluationSampleData,
          broadAncestryId
        })

        if (!evaluationSample) {
          const msg = `⚠️ No se pudo procesar el sample para PPM ID ${raw.id}`
          console.warn(msg)
          log(logPath, msg)
          continue
        }

        if (!evaluationSample?.id) {
          const msg = `⚠️ EvaluationSample retornado sin ID para PPM ID ${raw.id}`
          console.warn(msg)
          log(logPath, msg)
          continue
        }

        // Crear ModelEvaluation asociado
        const transformed = transformModelEvaluation(raw)
        const inserted = await insertModelEvaluation({
          ...transformed,
          evaluationPopulationSampleId: evaluationSample.id,
        })

        const msg = `✅ ModelEvaluation insertado: ${inserted.ppmId}`
        console.log(msg)
        log(logPath, msg)
      } catch (error) {
        const errMsg = `❌ Error al insertar ModelEvaluation PPM ID ${raw.id}: ${error}`
        console.error(errMsg)
        log(logPath, errMsg)
      }
    }
  })
}
