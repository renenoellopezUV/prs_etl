import fs from 'fs'
import path from 'path'

export function log(logPath: string, message: string) {
  const timestamp = new Date().toISOString() // Formato ISO para precisión
  const logMessage = `[${timestamp}] ${message}` // Incluye la fecha y hora
  fs.appendFileSync(logPath, logMessage + '\n')
}