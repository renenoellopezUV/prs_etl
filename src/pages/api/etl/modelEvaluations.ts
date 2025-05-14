import type { NextApiRequest, NextApiResponse } from 'next'
import { runModelEvaluationETL } from '@/app/services/etlService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    // Obtener el parámetro startPpmId desde la query (si está presente)
    const { startPpmId } = req.query

    // Ejecutar el ETL pasando el startPpmId si está definido
    await runModelEvaluationETL(startPpmId ? String(startPpmId) : undefined)
    
    res.status(200).json({ message: 'ETL de Model Evaluations completado con éxito' })
  } catch (error) {
    console.error('❌ Error en ETL de Model Evaluations:', error)
    res.status(500).json({ error: 'Error en ETL de Model Evaluations' })
  }
}
