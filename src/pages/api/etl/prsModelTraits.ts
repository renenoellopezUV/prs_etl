import type { NextApiRequest, NextApiResponse } from 'next'
import { runPRSModelTraitRelationETL } from '../../../app/services/etlService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    await runPRSModelTraitRelationETL()
    res.status(200).json({ message: 'ETL de relaciones PRSModel-Trait completado' })
  } catch (error) {
    console.error('❌ Error ejecutando ETL de relaciones:', error)
    res.status(500).json({ error: 'Error ejecutando ETL de relaciones' })
  }
}
