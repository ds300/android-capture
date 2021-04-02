const { spawn } = require("child_process")
const { gray } = require("kleur")
const { getDevice } = require("./getDevice")
const { verbose, formatSpawnArgs } = require("./log")
const { spawnSafeSync } = require("./spawnSafeSync")

let device = ""

module.exports.adb = (/** @type {string[]} */ ...args) =>
  spawnSafeSync("adb", ["-s", device, ...args])

module.exports.adbAsync = (/** @type {string[]} */ ...args) => {
  verbose(gray("$"), "adb", formatSpawnArgs(["-s", device, ...args]))
  return spawn("adb", ["-s", device, ...args])
}

module.exports.init = async () => {
  device = await getDevice()
}
