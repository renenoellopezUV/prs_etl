type TraitJson = {
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

  const BASE_URL = 'https://www.pgscatalog.org/rest'

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
