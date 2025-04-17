// src/pages/api/etl/publications.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { runPublicationETL } from '../../../app/services/etlService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    await runPublicationETL()
    res.status(200).json({ message: 'ETL de publicaciones completado exitosamente' })
  } catch (error) {
    console.error('❌ Error en ETL de publicaciones:', error)
    res.status(500).json({ error: 'Error al ejecutar ETL de publicaciones' })
  }
}
