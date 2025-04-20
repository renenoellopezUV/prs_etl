import fs from 'fs'
import path from 'path'

export function log(logPath: string, message: string) {
  fs.appendFileSync(logPath, message + '\n')
}

