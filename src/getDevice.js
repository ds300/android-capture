const { bold } = require("kleur")
const { fail } = require("./log")
const { selectOption } = require("./selectOption")

const { spawnSafeSync } = require("./spawnSafeSync")

module.exports.getDevice = async () => {
  const res = spawnSafeSync("which", ["adb"], { failOnError: false })
  if (res.status !== 0) {
    fail(
      `${bold("adb")} not found`,
      "Please install and configure the android dev tools.",
    )
  }

  const result = spawnSafeSync("adb", ["devices", "-l"]).stdout.toString()
  const deviceLines = result
    .replace("List of devices attached", "")
    .trim()
    .split(/\r?\n/g)
    .filter(Boolean)

  if (deviceLines.length === 0) {
    fail("No devices or emulators connected.")
  }

  if (deviceLines.length === 1) {
    return parseDeviceLine(deviceLines[0]).id
  } else {
    const choice = await selectOption(
      "Choose your device",
      deviceLines.map(parseDeviceLine).map(({ id, model, isUSB }) => {
        return [id, model, isUSB && `(${bold("USB")})`]
          .filter(Boolean)
          .join(" ")
      }),
    )

    return parseDeviceLine(deviceLines[choice]).id
  }
}

/**
 *
 * @param {string} line
 */
function parseDeviceLine(line) {
  const [id, _type, ...properties] = line.split(/\s+/)
  const model = (properties.find((p) => p.startsWith("model:")) || "").split(
    ":",
  )[1]
  const isUSB = properties.some((p) => p.startsWith("usb:"))
  return { id, model, isUSB }
}
