import { NextApiRequest, NextApiResponse } from 'next'
import { runTraitETL } from '../../../app/services/etlService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' })
  }

  try {
    const result = await runTraitETL()
    res.status(200).json({ message: 'ETL completado', inserted: result.length })
  } catch (error: any) {
    console.error('❌ Error en ETL:', error)
    res.status(500).json({ message: 'Error al ejecutar ETL', error: error.message })
  }
}