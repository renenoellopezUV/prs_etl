import { NextApiRequest, NextApiResponse } from 'next'
import { runBroadAncestryInModelETL } from '@/app/services/etlService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await runBroadAncestryInModelETL()
    res.status(200).json({ message: 'ETL de BroadAncestryInModel ejecutado correctamente' })
  } catch (error) {
    console.error('❌ Error ejecutando ETL:', error)
    res.status(500).json({ error: 'Error ejecutando ETL de BroadAncestryInModel' })
  }
}
