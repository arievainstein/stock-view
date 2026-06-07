import { spawn } from "node:child_process"
import { cp, mkdir, rm } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const frontendDir = path.resolve(scriptDir, "..")
const backendDir = path.resolve(frontendDir, "..", "backend")
const nextBin = path.resolve(frontendDir, "node_modules", "next", "dist", "bin", "next")
const exportDir = path.resolve(frontendDir, "out")
const backendAssetsDir = path.resolve(backendDir, "assets")

async function copyStaticOutput() {
  await mkdir(backendAssetsDir, { recursive: true })
  await rm(backendAssetsDir, { recursive: true, force: true })
  await mkdir(backendAssetsDir, { recursive: true })
  await cp(exportDir, backendAssetsDir, { recursive: true })
  console.log(`Copied static export to ${backendAssetsDir}`)
}

const child = spawn(process.execPath, [nextBin, "build"], {
  cwd: frontendDir,
  env: {
    ...process.env,
    STATIC_EXPORT: "true",
  },
  stdio: "inherit",
})

child.on("exit", async (code) => {
  if (code !== 0) {
    process.exit(code ?? 1)
  }

  try {
    await copyStaticOutput()
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})

child.on("error", (error) => {
  console.error(error)
  process.exit(1)
})