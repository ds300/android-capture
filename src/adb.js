const { spawn } = require("child_process")
const { getDevice } = require("./getDevice")
const { spawnSafeSync } = require("./spawnSafeSync")

let device = ""

module.exports.adb = (/** @type {string[]} */ ...args) =>
  spawnSafeSync("adb", ["-s", device, ...args])

module.exports.adbAsync = (/** @type {string[]} */ ...args) =>
  spawn("adb", ["-s", device, ...args])

module.exports.init = async () => {
  device = await getDevice()
}
