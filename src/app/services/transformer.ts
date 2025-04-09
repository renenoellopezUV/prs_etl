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