import path from 'path'
import { fetchAllModelEvaluationsIncremental, fetchAllTraits, fetchAllPRSModelsIncremental, fetchAllPublicationsIncremental, fetchAllTraitCategories, fetchBroadAncestryCategories } from './externalApi'
import { transformEvaluationSample, transformModelEvaluation, transformAllTraits, transformPRSModel, transformPublication, transformAllTraitCategories, extractPRSModelTraitRelations, extractDevelopmentPopulationSamples, transformBroadAncestryCategories } from './transformer'
import { insertBroadAncestryInModel, insertPerformanceMetricEvaluation, findOrCreatePerformanceMetric, findOrCreateEvaluationSample, insertModelEvaluation, insertTrait, insertPRSModel, insertPublication, insertTraitCategoryWithRelations, connectPRSModelWithTrait, insertDevelopmentPopulationSample, insertBroadAncestryCategory, getBroadAncestryCategoryIdByLabel } from '../repositories/insertData'
import { log } from '../../utils/logging'
import { getBroadAncestryLabelFromRaw, BROAD_ANCESTRY_MAPPING } from '../../utils/broadAncestryMapping'
import { prisma } from '@/utils/prisma'
import { fetchModelEvaluationsByIds } from './externalApi'


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


async function processModelEvaluations(results: any[], logPath: string) {
  for (const raw of results) {
    try {
      // Transformar EvaluationSample
      const evaluationSampleData = transformEvaluationSample(raw)
      const normalized = evaluationSampleData.ancestryBroad
      const ancestryGroup = BROAD_ANCESTRY_MAPPING[normalized] ?? null

      if (!ancestryGroup) {
        const warnMsg = `⚠️ Ancestría no mapeada para: ${normalized} (PPM ID ${raw.id})`
        console.warn(warnMsg)
        log(logPath, warnMsg)
        continue
      }

      const broadAncestryId = await getBroadAncestryCategoryIdByLabel(ancestryGroup)

      if (!broadAncestryId) {
        const warnMsg = `⚠️ No se encontró BroadAncestry para ancestry_broad='${evaluationSampleData.ancestryBroad}' (normalizado: '${ancestryGroup}') en PPM ID ${raw.id}`
        console.warn(warnMsg)
        log(logPath, warnMsg)
        continue
      }

      const evaluationSample = await findOrCreateEvaluationSample({
        ...evaluationSampleData,
        broadAncestryId,
      })

      if (!evaluationSample) {
        const msg = `⚠️ No se pudo procesar el sample para PPM ID ${raw.id}`
        console.warn(msg)
        log(logPath, msg)
        continue
      }

      const transformed = transformModelEvaluation(raw)
      const inserted = await insertModelEvaluation({
        ...transformed,
        evaluationPopulationSampleId: evaluationSample.id,
      })

      const msg = `✅ ModelEvaluation insertado: ${inserted.ppmId}`
      console.log(msg)
      log(logPath, msg)

      const allMetrics = [
        ...(raw.performance_metrics?.effect_sizes || []).map((m: any) => ({ ...m, type: 'RISK_ASSOCIATION' })),
        ...(raw.performance_metrics?.class_acc || []).map((m: any) => ({ ...m, type: 'DISCRIMINATING_POWER' })),
        ...(raw.performance_metrics?.othermetrics || []).map((m: any) => ({ ...m, type: 'OTHER' })),
      ]

      for (const metric of allMetrics) {
        try {
          const performanceMetric = await findOrCreatePerformanceMetric({
            nameShort: metric.name_short,
            nameLong: metric.name_long,
            type: metric.type,
          })

          await insertPerformanceMetricEvaluation({
            modelEvaluationId: inserted.id,
            performanceMetricId: performanceMetric.id,
            estimate: metric.estimate,
            ciLower: metric.ci_lower ?? null,
            ciUpper: metric.ci_upper ?? null,
          })
        } catch (metricError) {
          const errorMsg = `❌ Error al insertar PerformanceMetric para PPM ${raw.id}: ${metric.name_short} (${metric.type}): ${metricError}`
          console.error(errorMsg)
          log(logPath, errorMsg)
        }
      }
    } catch (error) {
      const errMsg = `❌ Error al insertar ModelEvaluation PPM ID ${raw.id}: ${error}`
      console.error(errMsg)
      log(logPath, errMsg)
    }
  }
}

export async function runSelectedModelEvaluationsETL(ppmIds: string[]) {
  const logPath = path.join(process.cwd(), 'data', 'modelEvaluation_selected_log.txt')
  const results = await fetchModelEvaluationsByIds(ppmIds)
  await processModelEvaluations(results, logPath)
}

export async function runModelEvaluationETL(startAfterPpmId?: string) {
  const logPath = path.join(process.cwd(), 'data', 'modelEvaluation_log.txt')
  await fetchAllModelEvaluationsIncremental(async (batch) => {
    await processModelEvaluations(batch, logPath)
  }, startAfterPpmId)
}


export async function runBroadAncestryInModelETL() {
  const logPath = path.join(process.cwd(), 'data', 'broadAncestryInModel_log.txt')

  const allPRSModels = await prisma.pRSModel.findMany({
    include: {
      DevelopmentPopulationSamples: true
    }
  })

  for (const model of allPRSModels) {
    const samples = model.DevelopmentPopulationSamples

    const totalIndividuals = samples.reduce((sum, s) => sum + (s.numberOfIndividuals || 0), 0)
    if (totalIndividuals === 0) {
      const warnMsg = `⚠️ Modelo ${model.pgscId} no tiene individuos registrados.`
      console.warn(warnMsg)
      log(logPath, warnMsg)
      continue
    }

    const grouped: Record<number, number> = {}
    for (const s of samples) {
      if (!s.broadAncestryId) continue
      grouped[s.broadAncestryId] = (grouped[s.broadAncestryId] || 0) + (s.numberOfIndividuals || 0)
    }

    for (const [broadAncestryIdStr, count] of Object.entries(grouped)) {
      const percentage = (count / totalIndividuals) * 100
      const broadAncestryId = parseInt(broadAncestryIdStr)
      try {
        await insertBroadAncestryInModel({
          prsModelId: model.id,
          broadAncestryId,
          percentage
        })
        const msg = `✅ Registro creado: PRSModel ${model.pgscId} ↔ BroadAncestry ${broadAncestryId} (${percentage.toFixed(2)}%)`
        console.log(msg)
        log(logPath, msg)
      } catch (error) {
        const errMsg = `❌ Error al crear relación PRSModel ${model.pgscId} y BroadAncestry ${broadAncestryId}: ${error}`
        console.error(errMsg)
        log(logPath, errMsg)
      }
    }
  }
}
