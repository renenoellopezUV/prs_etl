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
