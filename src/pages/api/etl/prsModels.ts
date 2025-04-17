

import type { NextApiRequest, NextApiResponse } from 'next'
import { runPRSModelETL } from '../../../app/services/etlService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido. Usa GET.' })
  }

  try {
    await runPRSModelETL()
    res.status(200).json({ message: 'ETL de PRS Model completado con éxito ✅' })
  } catch (error: any) {
    console.error('❌ Error en ETL de PRS Model:', error)
    res.status(500).json({ message: 'Error en ETL', error: error.message })
  }
}