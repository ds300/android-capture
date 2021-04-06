const { spawn } = require("child_process")
const { gray, bold } = require("kleur")
const { getDevice } = require("./getDevice")
const { verbose, formatSpawnArgs, fail } = require("./log")
const { spawnSafeSync } = require("./spawnSafeSync")
const { join } = require("path")

let device = ""
let adbPath = "adb"

module.exports.adb = (/** @type {string[]} */ ...args) =>
  spawnSafeSync(adbPath, ["-s", device, ...args])

module.exports.adbAsync = (/** @type {string[]} */ ...args) => {
  verbose(gray("$"), "adb", formatSpawnArgs(["-s", device, ...args]))
  return spawn(adbPath, ["-s", device, ...args])
}

function setupAdbPath() {
  const adbs = [
    process.env["ANDROID_HOME"] || "",
    process.env["ANDROID_SDK_ROOT"] || "",
  ]
    .filter(Boolean)
    .map((dir) => join(dir, "adb"))
    .concat(["adb"])
  for (const _adbPath of adbs) {
    verbose("Trying", bold("adb"), "at path", bold(_adbPath))
    adbPath = adbPath
    const result = spawnSafeSync(adbPath, ["devices"])
    if (!result.error && result.status === 0) {
      verbose("It worked!")
      return true
    }
  }
  return false
}

module.exports.init = async () => {
  if (!setupAdbPath()) {
    fail(
      `${bold("adb")} not found`,
      "Please install and configure the android dev tools.",
    )
  }
  device = await getDevice()
}
