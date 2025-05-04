import { TraitJson } from './externalApi' // si lo defines en otro archivo

export function transformTrait(raw: TraitJson) {
  if (!raw.id || !raw.label || !raw.url) {
    throw new Error(`❌ Trait con campos faltantes: ${JSON.stringify(raw)}`)
  }

  const idValue = raw.id

  return {
    label: raw.label,
    description: raw.description ?? null,
    URL: raw.url,
    efoId: idValue.startsWith('EFO_') ? idValue : null,
    mondoId: idValue.startsWith('MONDO_') ? idValue : null,
    hpoId: idValue.startsWith('HP_') ? idValue : null,
    orphaId: idValue.startsWith('OBA_') ? idValue : null,
    otherId:
      !idValue.startsWith('EFO_') &&
      !idValue.startsWith('MONDO_') &&
      !idValue.startsWith('HP_') &&
      !idValue.startsWith('OBA_')
        ? idValue
        : null,
  }
}



export function transformAllTraits(traits: any[]): ReturnType<typeof transformTrait>[] {
  return traits.map(transformTrait)
}

type TraitCategoryJson = {
  label: string
  efotraits: { id: string }[]
}

export function transformTraitCategory(raw: TraitCategoryJson) {
  return {
    label: raw.label,
    traitEfoIds: raw.efotraits.map(t => t.id),
  }
}

export function transformAllTraitCategories(raw: { results: TraitCategoryJson[] }) {
  return raw.results.map(transformTraitCategory)
}



type RawPRSModel = {
  id: string
  name: string
  variants_number: number
}

export function transformPRSModel(raw: any) {
  const publication = raw.publication
  const pmid = publication?.PMID

  if (!pmid) {
    console.warn(`⚠️ PRSModel ${raw.id} no tiene PMID en publication`)
  }

  return {
    name: raw.name,
    numberOfSNP: raw.variants_number,
    pgscId: raw.id,
    pgscURL: `https://www.pgscatalog.org/score/${raw.id}/`,
    publicationPmid: typeof pmid === 'number' ? pmid.toString() : (pmid ?? null),
  }
}

export function extractPRSModelTraitRelations(raw: any) {
  const pgscId = raw.id
  const traits = raw.trait_efo?.map((trait: any) => trait.id) ?? []
  return { pgscId, traitIds: traits }
}

export function transformAllPRSModels(rawData: any): ReturnType<typeof transformPRSModel>[] {
  const rawResults = rawData?.results

  if (!Array.isArray(rawResults) || rawResults.length === 0) {
    console.error('❌ Error: La propiedad "results" no contiene datos válidos:', rawResults)
    throw new Error('❌ La respuesta de la API no tiene resultados válidos.')
  }

  console.log(`✔️ Se recibieron ${rawResults.length} registros de PRS Models.`)

  return rawResults.map(transformPRSModel)
}

export function transformPublication(raw: any) {
  const journal = raw.journal?.toLowerCase() || ''
  const date = raw.date_publication ? new Date(raw.date_publication) : null

  return {
    pgpId: raw.id,
    title: raw.title,
    journal: raw.journal,
    author: raw.firstauthor,
    date: date, // Convertido a Date
    year: date ? date.getFullYear() : 0,
    pmid: journal.includes('medrxiv') || journal.includes('biorxiv')
      ? null
      : raw.PMID?.toString() ?? null, // 🔄 Convertir PMID a string
    doi: raw.doi?.trim() || 'PENDIENTE',
  }
}

type RawSample = {
  sample_number: number
  sample_cases: number | null
  sample_controls: number | null
  sample_percent_male: number | null
  sample_age?: {
    estimate: number
    unit: string
  }
  ancestry_broad: string
  ancestry_free: string | null
  ancestry_country: string | null
  source_GWAS_catalog: string | null
  source_PMID: string | null
  source_DOI: string | null
  cohorts: { name_full: string; name_short: string }[]
}

type RawPRSModelSamples = {
  id: string
  samples_variants: RawSample[]
  samples_training: RawSample[]
}

export function extractDevelopmentPopulationSamples(raw: RawPRSModelSamples): any[] {
  const extract = (sample: RawSample, role: string) => ({
    numberOfIndividuals: sample.sample_number,
    numberOfCases: sample.sample_cases,
    numberOfControls: sample.sample_controls,
    percentMale: sample.sample_percent_male,
    age: sample.sample_age?.estimate ?? null,
    ageUnits: sample.sample_age?.unit ?? null,
    ancestryBroad: sample.ancestry_broad,
    ancestryDetails: sample.ancestry_free,
    cohort: sample.cohorts?.map(c => `${c.name_full} (${c.name_short})`).join(', ') ?? null,
    gcId: sample.source_GWAS_catalog,
    sourcePMID: sample.source_PMID?.toString() ?? null,
    sourceDOI: sample.source_DOI,
    role,
    pgscId: raw.id
  })

  return [
    ...(raw.samples_variants || []).map(s => extract(s, 'BASE')),
    ...(raw.samples_training || []).map(s => extract(s, 'TUNING')),
  ]
}

export function transformBroadAncestryCategories(rawData: Record<string, any>) {
  return Object.entries(rawData).map(([symbol, value]) => ({
    symbol,
    label: value.display_category
  }))
}



export function transformModelEvaluation(raw: any) {
  return {
    ppmId: raw.id,
    reportedTrait: raw.phenotyping_reported,
    covariates: raw.covariates ?? null,
    pgscId: raw.associated_pgs_id,
    pgpId: raw.publication?.id ?? null,
  }
}

export function transformEvaluationSample(raw: any): any {
  const sample = raw.sampleset?.samples?.[0]
  const cohorts = (sample?.cohorts || []).map(
    (c: any) => `${c.name_full} (${c.name_short})`
  ).join(', ')

  return {
    numberOfIndividuals: sample?.sample_number ?? null,
    numberOfCases: sample?.sample_cases ?? null,
    numberOfControls: sample?.sample_controls ?? null,
    percentMale: sample?.sample_percent_male ?? null,
    age: sample?.sample_age?.estimate ?? null, 
    ageUnits: sample?.sample_age?.unit ?? null, 
    ancestryBroad: sample?.ancestry_broad ?? null,
    ancestryDetails: sample?.ancestry_free ?? null,
    cohort: cohorts,
    gcId: sample?.source_GWAS_catalog ?? null,
    sourcePMID: sample?.source_PMID?.toString() ?? null,
    sourceDOI: sample?.source_DOI ?? null,
    phenotypeFree: sample?.phenotyping_free ?? null,
    pssId: raw.sampleset?.id ?? null,
  }
}
