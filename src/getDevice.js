const { bgRed, bold, bgBlue, cyan, gray } = require("kleur")
const logUpdate = require("log-update")

const { spawnSafeSync } = require("./spawnSafeSync")

const ERROR = bgRed(" ERROR ")

module.exports.getDevice = async () => {
  const res = spawnSafeSync("which", ["adb"], {
    logStdErrOnError: false,
    throwOnError: false,
  })
  if (res.status !== 0) {
    console.error(ERROR, bold("adb"), "not found")
    console.error("Please install and configure the android dev tools.")
  }

  const result = spawnSafeSync("adb", ["devices", "-l"]).stdout.toString()
  const deviceLines = result
    .replace("List of devices attached", "")
    .trim()
    .split(/\r?\n/g)
    .filter(Boolean)
  if (deviceLines.length === 0) {
    console.error(bgRed(" ERROR "), "No devices or emulators connected.")
    process.exit(0)
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
  const model = properties.find((p) => p.startsWith("model:"))?.split(":")[1]
  const isUSB = properties.some((p) => p.startsWith("usb:"))
  return { id, model, isUSB }
}

/**
 * @param {string} title
 * @param {string[]} options
 * @returns {Promise<number>}
 */
async function selectOption(title, options) {
  return new Promise((resolve) => {
    let selection = 0
    const draw = () => {
      const lines = ["", "        " + bgBlue(` ${title} `), ""]
      for (let i = 0; i < options.length; i++) {
        lines.push(
          "  " +
            (i === selection
              ? cyan().bold("• [" + (i + 1) + "]")
              : gray("  [" + (i + 1) + "]")) +
            options[i],
        )
      }
      lines.push("", "Use up/down arrow keys and hit [ENTER]")
      logUpdate(lines.join("\n"))
    }

    draw()
    /**
     * @param {string} key
     */
    function handleKeyPress(key) {
      if (key === "\r") {
        // enter!
        process.stdin.removeListener("data", handleKeyPress)
        resolve(selection)
      } else if (key === "\u001b[B") {
        // arrow down!
        selection = Math.min(selection + 1, options.length - 1)
        draw()
      } else if (key === "\u001b[A") {
        // arrow up!
        selection = Math.max(selection - 1, 0)
        draw()
      } else if (key in ESCAPE_KEYS) {
        process.exit(1)
      }
    }
    process.stdin.on("data", handleKeyPress)
  })
}

const ESCAPE_KEYS = {
  // ctrl-c
  "\u0003": true,
  // escape
  "\u001b": true,
  // ctrl-z
  "\u001a": true,
  // ctrl-d
  "\u0004": true,
}
