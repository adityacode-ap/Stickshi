import { spawn } from 'node:child_process'

const backend = spawn(process.execPath, ['server/index.js'], { stdio: 'inherit' })
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' })

for (const p of [backend, vite]) {
  p.on('exit', () => {
    backend.kill()
    vite.kill()
    process.exit(0)
  })
}