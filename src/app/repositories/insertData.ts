import { prisma } from '@/utils/prisma'

type TraitInput = {
  label: string
  description: string | null
  url: string
  EFO_id: string | null
  MONDO_id: string | null
  HPO_id: string | null
  Orpha_id: string | null
  Other_id: string | null
}

export async function insertTrait(trait: TraitInput) {
  // Aquí puedes validar o filtrar duplicados si lo necesitas
  return await prisma.trait.create({
    data: trait,
  })
}


type TraitCategoryInput = {
  label: string
  traitEfoIds: string[]
}

export async function insertTraitCategoryWithRelations(input: TraitCategoryInput) {
  const traits = await prisma.trait.findMany({
    where: {
      OR: [
        { efoId: { in: input.traitEfoIds } },
        { mondoId: { in: input.traitEfoIds } },
        { hpoId: { in: input.traitEfoIds } },
        { orphaId: { in: input.traitEfoIds } },
        { otherId: { in: input.traitEfoIds } },
      ],
    },
    select: { id: true },
  })

  if (traits.length === 0) {
    console.warn(`⚠️ No se encontraron traits para la categoría "${input.label}"`)
  }

  return await prisma.traitCategory.create({
    data: {
      label: input.label,
      traits: {
        create: traits.map(trait => ({
          trait: { connect: { id: trait.id } },
        })),
      },
    },
  })
}



type PRSModelInput = {
  name: string
  numberOfSNP: number
  pgscId: string
  pgscURL: string
}

export async function insertPRSModel(data: any) {
  let publication = null;

  if (data.publicationPmid) {
    publication = await prisma.publication.findUnique({
      where: { PMID: data.publicationPmid },
    });
  }

  // Si no la encontró por PMID, busca por pgpId
  if (!publication && data.publicationId) {
    publication = await prisma.publication.findUnique({
      where: { pgpId: data.publicationId },
    });
  }

  if (!publication) {
    throw new Error(`❌ No se encontró la publicación con PMID '${data.publicationPmid}' ni pgpId '${data.publicationId}'`);
  }

  return await prisma.pRSModel.create({
    data: {
      name: data.name,
      numberOfSNP: data.numberOfSNP,
      pgscId: data.pgscId,
      pgscURL: data.pgscURL,
      publication: {
        connect: { id: publication.id },
      },
    },
  });
}

export async function insertPublication(data: any) {
  return await prisma.publication.create({
    data: {
      pgpId: data.pgpId,
      title: data.title,
      journal: data.journal,
      author: data.author,
      date: data.date,
      year: data.year,
      PMID: data.pmid,
      DOI: data.doi,
    },
  })
}

export async function connectPRSModelWithTrait(pgscId: string, traitId: string) {
  const prsModel = await prisma.pRSModel.findUnique({ where: { pgscId } })
  if (!prsModel) throw new Error(`PRSModel no encontrado con pgscId ${pgscId}`)

  const trait = await prisma.trait.findFirst({
    where: {
      OR: [
        { efoId: traitId },
        { mondoId: traitId },
        { hpoId: traitId },
        { orphaId: traitId },
      ]
    }
  })
  if (!trait) throw new Error(`Trait no encontrado con id ${traitId}`)

  return await prisma.pRSModelToTrait.create({
    data: {
      prsModelId: prsModel.id,
      traitId: trait.id,
    }
  })
}


export async function insertDevelopmentPopulationSample(data: any) {
  const prsModel = await prisma.pRSModel.findUnique({
    where: { pgscId: data.pgscId },
  })

  if (!prsModel) {
    throw new Error(`PRSModel no encontrado con pgscId: ${data.pgscId}`)
  }

  return prisma.developmentPopulationSample.create({
    data: {
      numberOfIndividuals: data.numberOfIndividuals,
      numberOfCases: data.numberOfCases,
      numberOfControls: data.numberOfControls,
      percentMale: data.percentMale,
      age: data.age,
      ageUnits: data.ageUnits,
      ancestryBroad: data.ancestryBroad,
      ancestryDetails: data.ancestryDetails,
      cohort: data.cohort,
      gcId: data.gcId,
      sourcePMID: data.sourcePMID,
      sourceDOI: data.sourceDOI,
      role: data.role,
      prsModel: { connect: { id: prsModel.id } },
      broadAncestryCategory: { connect: {id: data.broadAncestryCategoryId }}
    },
  })
}

export async function insertBroadAncestryCategory(data: { symbol: string; label: string }) {
  return await prisma.broadAncestryCategory.create({
    data: {
      symbol: data.symbol,
      label: data.label
    }
  })
}

export async function getBroadAncestryCategoryIdByLabel(label: string): Promise<number | null> {
  //console.log(`🔎 Buscando BroadAncestryCategory con label (insensitive): "${label}"`)

  const allCategories = await prisma.broadAncestryCategory.findMany()

  const match = allCategories.find(c => c.label.toLowerCase() === label.toLowerCase())

  if (match) {
    return match.id
  } else {
    console.warn(`❌ No se encontró BroadAncestryCategory con label (insensitive): "${label}"`)
    return null
  }
}


export async function insertModelEvaluation(data: any) {
  const pgscId = data.pgscId
  const pgpId = data.pgpId
  const evaluationPopulationSampleId = data.evaluationPopulationSampleId

  const prsModel = await prisma.pRSModel.findUnique({
    where: { pgscId }
  })
  if (!prsModel) throw new Error(`❌ PRSModel no encontrado: ${pgscId}`)

  const publication = await prisma.publication.findUnique({
    where: { pgpId }
  })
  if (!publication) throw new Error(`❌ Publication no encontrada: ${pgpId}`)

  return await prisma.modelEvaluation.create({
    data: {
      ppmId: data.ppmId,
      reportedTrait: data.reportedTrait,
      covariates: data.covariates,
      prsModel: { connect: { id: prsModel.id } },
      publication: { connect: { id: publication.id } },
      evaluationPopulationSample: { connect: { id: evaluationPopulationSampleId } }
    }
  })
}

export async function findOrCreateEvaluationSample(data: any) {
  const {
    numberOfIndividuals,
    numberOfCases,
    numberOfControls,
    percentMale,
    age,
    ageUnits,
    ancestryBroad,
    ancestryDetails,
    cohort,
    gcId,
    sourcePMID,
    sourceDOI,
    phenotypeFree,
    pssId,
    broadAncestryId,
  } = data

  if (!pssId) {
    console.warn(`⚠️ SampleSet sin PSS ID válido`)
    return null
  }

  // Verificar si ya existe un sample con ese PSS ID
  const existing = await prisma.evaluationPopulationSample.findFirst({
    where: { pssId },
  })

  if (existing) return existing

  // Crear nuevo sample
  return await prisma.evaluationPopulationSample.create({
    data: {
      numberOfIndividuals,
      numberOfCases,
      numberOfControls,
      percentMale,
      age,
      ageUnits,
      ancestryBroad,
      ancestryDetails,
      cohort,
      gcId,
      sourcePMID,
      sourceDOI,
      phenotypeFree,
      pssId,
      broadAncestryCategory: {
        connect: { id: broadAncestryId }
      }
    }
  })
}


export async function findOrCreatePerformanceMetric(data: {
  nameShort: string
  nameLong: string
  type: 'RISK_ASSOCIATION' | 'DISCRIMINATING_POWER' | 'OTHER'
}) {
  const existing = await prisma.performanceMetric.findFirst({
    where: {
      nameShort: data.nameShort,
      type: data.type
    }
  })

  if (existing) return existing

  return await prisma.performanceMetric.create({
    data: {
      nameShort: data.nameShort,
      nameLong: data.nameLong,
      type: data.type
    }
  })
}


export async function insertPerformanceMetricEvaluation(data: {
  modelEvaluationId: number,
  performanceMetricId: number,
  estimate: number,
  ciLower: number | null,
  ciUpper: number | null
}) {
  return await prisma.performanceMetricEvaluation.create({
    data: {
      estimate: data.estimate,
      CILower: data.ciLower,
      CIUpper: data.ciUpper,
      modelEvaluation: {
        connect: { id: data.modelEvaluationId }
      },
      performanceMetric: {
        connect: { id: data.performanceMetricId }
      }
    }
  })
}

export async function insertBroadAncestryInModel(data: {
  prsModelId: number
  broadAncestryId: number
  percentage: number
}) {
  return await prisma.broadAncestryInModel.create({ data })
}