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
    orphaId: idValue.startsWith('Orphanet') || idValue.startsWith('OBA_') ? idValue : null,
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