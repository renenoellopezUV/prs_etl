import type { NextApiRequest, NextApiResponse } from 'next'
import { runDevelopmentSamplesETL } from '@/app/services/etlService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' })
  }

  try {
    await runDevelopmentSamplesETL()
    res.status(200).json({ message: '✔️ ETL de Development Samples completado exitosamente.' })
  } catch (error) {
    console.error('❌ Error en ETL de Development Samples:', error)
    res.status(500).json({ message: '❌ Error al ejecutar ETL de Development Samples', error })
  }
}
