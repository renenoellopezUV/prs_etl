import type { NextApiRequest, NextApiResponse } from 'next'
import { runModelEvaluationETL, runSelectedModelEvaluationsETL } from '@/app/services/etlService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { startPpmId, ppmIds } = req.query

    if (ppmIds) {
      // Procesar solo los IDs específicos: ?ppmIds=PPM000001,PPM000002
      const idList = String(ppmIds)
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)

      if (idList.length === 0) {
        return res.status(400).json({ error: 'ppmIds está vacío o mal formado' })
      }

      await runSelectedModelEvaluationsETL(idList)
      return res.status(200).json({ message: `ETL ejecutado para ${idList.length} Model Evaluations` })
    }

    // Procesar todo o desde un ID específico
    await runModelEvaluationETL(startPpmId ? String(startPpmId) : undefined)

    res.status(200).json({ message: 'ETL de Model Evaluations completado con éxito' })
  } catch (error) {
    console.error('❌ Error en ETL de Model Evaluations:', error)
    res.status(500).json({ error: 'Error en ETL de Model Evaluations' })
  }
}
