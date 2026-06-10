import { existsSync, rmSync } from "node:fs"
import { spawnSync } from "node:child_process"

function runStep(args) {
  const command = `npm ${args.join(" ")}`
  const result = spawnSync(command, {
    stdio: "inherit",
    shell: true,
  })

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status)
  }

  if (result.error) {
    throw result.error
  }
}

function wait(ms) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < ms) {
    // Give previous child processes a short cooldown before the build step.
  }
}

function main() {
  const ci = process.argv.includes("--ci")
  const includeBuild = process.argv.includes("--build")
  const steps = [
    ["run", "lint"],
    ["run", "typecheck"],
    ["run", "test:unit"],
    ["run", "test:smoke"],
    ["run", "ops:migration-check"],
    ci ? ["run", "ops:preflight", "--", "--ci"] : ["run", "ops:preflight"],
  ]

  if (includeBuild) {
    steps.push(["run", "build"])
  }

  for (const step of steps) {
    const isBuildStep = step[1] === "build"

    if (isBuildStep) {
      const nextLockPath = new URL("../.next/lock", import.meta.url)

      if (existsSync(nextLockPath)) {
        rmSync(nextLockPath, { force: true })
      }

      wait(1500)
    }

    runStep(step)
  }
}

main()
