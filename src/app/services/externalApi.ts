export type TraitJson = {
    id: string
    label: string
    description?: string
    url: string
    trait_categories?: any[] // puedes tipar esto más adelante si quieres
  }
  
  type PaginatedTraitResponse = {
    count: number
    next: string | null
    previous: string | null
    results: TraitJson[]
  }


export async function fetchAllTraits(): Promise<TraitJson[]> {
  let allResults: TraitJson[] = []
  let nextUrl: string | null = `${BASE_URL}/trait/all`

  while (nextUrl) {
    const res: Response = await fetch(nextUrl)

    if (!res.ok) {
      throw new Error(`Error al obtener traits: ${res.statusText}`)
    }

    const data: PaginatedTraitResponse = await res.json()
    console.log(`✔️ Página recibida: ${data.results.length} traits`)

    allResults = allResults.concat(data.results)
    nextUrl = data.next
  }

  console.log(`✅ Total de traits obtenidos: ${allResults.length}`)
  return allResults
}

export async function fetchAllTraitCategories(): Promise<any[]> {
  const res: Response = await fetch(`${BASE_URL}/trait_category/all`)

  if (!res.ok) {
    throw new Error(`Error al obtener trait categories: ${res.statusText}`)
  }

  const data: any[] = await res.json()
  console.log(`✔️ Se obtuvieron ${data.length} trait categories desde /trait_category/all`)
  return data
}


const BASE_URL = 'https://www.pgscatalog.org/rest'


function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


export async function fetchAllPRSModelsIncremental(
  processFn: (batch: any[]) => Promise<void>
) {
  let nextUrl: string | null = `${BASE_URL}/score/all`

  while (nextUrl) {
    const res: Response = await fetch(nextUrl)

    if (!res.ok) {
      if (res.status === 429) {
        console.log('⚠️ Too many requests. Waiting 60s...')
        await delay(60000)
        continue
      }
      throw new Error(`Error al obtener PRS Models: ${res.statusText}`)
    }

    const data: any = await res.json()
    const results = data?.results

    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('❌ Resultado vacío o no válido')
    }

    console.log(`✔️ Procesando batch de ${results.length} modelos PRS...`)
    await processFn(results)

    nextUrl = data.next
  }

  console.log('✅ ETL de PRS Models completado.')
}

// src/services/externalApi.ts
export async function fetchAllPublicationsIncremental(
  processFn: (batch: any[]) => Promise<void>
) {
  let nextUrl: string | null = 'https://www.pgscatalog.org/rest/publication/all'

  while (nextUrl) {
    const res = await fetch(nextUrl)

    if (!res.ok) {
      if (res.status === 429) {
        console.log('⚠️ Too many requests. Waiting 60s...')
        await new Promise(resolve => setTimeout(resolve, 60000))
        continue
      }
      throw new Error(`Error al obtener publicaciones: ${res.statusText}`)
    }

    const data = await res.json()
    const results = data?.results

    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('❌ Resultado vacío o no válido en publicaciones')
    }

    console.log(`✔️ Procesando batch de ${results.length} publicaciones...`)
    await processFn(results)

    nextUrl = data.next
  }

  console.log('✅ ETL de publicaciones completado.')
}


export async function fetchBroadAncestryCategories(): Promise<Record<string, any>> {
  const res = await fetch(`${BASE_URL}/ancestry_categories/`)

  if (!res.ok) {
    throw new Error(`Error al obtener Broad Ancestry Categories: ${res.statusText}`)
  }

  const data = await res.json()
  console.log(`✔️ Broad Ancestry Categories obtenidas: ${Object.keys(data).length}`)
  return data
}


export async function fetchAllModelEvaluationsIncremental(onBatch: (batch: any[]) => Promise<void>) {
  let nextUrl: string | null = `${BASE_URL}/performance/all`

  while (nextUrl) {
    const res: Response = await fetch(nextUrl)

    if (!res.ok) {
      throw new Error(`Error al obtener model evaluations: ${res.statusText}`)
    }

    const data: any = await res.json()
    console.log(`📦 Página recibida: ${data.results.length} evaluations`)

    await onBatch(data.results)
    nextUrl = data.next
  }
}
