const { join } = require("path")

const chalk = require("kleur")
const { init, adb, adbAsync } = require("./src/adb")
const { existsSync } = require("fs")
const { countdown } = require("./src/countdown")
const { cli } = require("./src/cli")
const { normalize } = require("path")
const logUpdate = require("log-update")
const { pushContext, popContext } = require("./src/keyboardInput")

const version = require(join(__dirname, "./package.json")).version

console.log(chalk.bold("record-android-screen"), version, "\n")

/**
 * @returns {boolean}
 */
function getVisibleTouches() {
  return (
    adb(
      "shell",
      "settings",
      "get",
      "system",
      "show_touches",
    ).stdout.toString() === "1"
  )
}

function getScreenSize() {
  const output = adb("shell", "wm", "size").stdout.toString()
  const match = output.match(/(\d+)x(\d+)/)
  if (!match) {
    throw new Error(
      "Can't parse output for command 'adb shell wm size': " +
        JSON.stringify(output),
    )
  }
  return {
    width: Number(match[1]),
    height: Number([match[2]]),
  }
}

/**
 * @param {boolean} visible
 */
function setVisibleTouches(visible) {
  adb("shell", "settings", "put", "system", "show_touches", visible ? "1" : "0")
}

const ENTER_KEYS = {
  // return
  "\r": true,
  // space
  " ": true,
}

/**
 * @param {string} outFile
 * @returns {Promise<{escaped: boolean}>}
 */
async function recordVideo(outFile) {
  const internalFilePath = `/sdcard/android-screen-recording.mp4`
  const screenSize = getScreenSize()

  if (!cli.flags.fullRes) {
    screenSize.width = Math.floor(screenSize.width / 2)
    screenSize.height = Math.floor(screenSize.height / 2)
  }
  const { width, height } = screenSize

  const recordProc = adbAsync(
    "shell",
    "screenrecord",
    internalFilePath,
    "--size",
    `${width}x${height}`,
  )

  const display = new RecordingMessage().start()

  return new Promise((resolve, reject) => {
    let err = ""
    recordProc.stderr.on("data", (data) => {
      err += data.toString()
    })
    let escaped = false
    recordProc.on("error", reject)
    recordProc.on("exit", async () => {
      display.stop()

      if (err) {
        console.log(err)
      }

      if (!escaped) {
        logUpdate(
          `          ${chalk.green(
            "✔",
          )} Cut!\n\nTransferring video from phone...`,
        )
        await new Promise((r) => setTimeout(r, 2000))
        console.log()
        adb("pull", internalFilePath, outFile)
      } else {
        logUpdate(`          ${chalk.bold().red("♺")} Cancelling...\n\n`)
      }
      adb("shell", "rm", internalFilePath)
      resolve({ escaped })
    })

    // on any data into stdin

    pushContext({
      handleEscape() {
        escaped = true
        recordProc.kill("SIGTERM")
        popContext()
      },
      handleKeyPress(key) {
        if (key in ENTER_KEYS) {
          recordProc.kill("SIGTERM")
          popContext()
        }
      },
    })
  })
}

class RecordingMessage {
  constructor() {
    /**
     * @type {NodeJS.Timeout | null}
     */
    this.interval = null
    this.toggle = true
  }
  start() {
    this.print()
    this.interval = setInterval(this.print.bind(this), 800)
    return this
  }
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
    }
    logUpdate("")
    return this
  }
  print() {
    logUpdate(`          ${this.toggle ? chalk.red("⦿") : " "} Recording...

Press ${printKey(
      chalk.bold().green("SPACE"),
    )} to finish recording, or ${printKey("ESC")} to cancel.`)
    this.toggle = !this.toggle
  }
}

/**
 * @param {string} label
 */
function printKey(label) {
  return chalk.gray("[") + label + chalk.gray("]")
}

async function run() {
  try {
    const [filename, ...others] = cli.input

    if (others.length) {
      console.error("Unexpected arguements: ", others.join(" "))
      cli.showHelp(1)
    }

    const outPath = normalize(sanitizeFilename(filename) ?? generateFilename())

    await init()
    await countdown()

    const hasVisibleTouchesByDefault = getVisibleTouches()

    setVisibleTouches(true)

    try {
      const result = await recordVideo(outPath)
      if (!result.escaped) {
        console.log("That's a wrap!", chalk.bold(outPath))
      }
      console.log()
    } catch (e) {
      console.error("failed in main loop", e)
    }

    setVisibleTouches(hasVisibleTouchesByDefault)

    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

function generateFilename() {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  let filename = `./recording.${year}-${month}-${day}.00.mp4`
  let i = 1
  while (existsSync(filename)) {
    filename = `./recording.${year}-${month}-${day}.${i
      .toString()
      .padStart(2, "0")}.mp4`
    i++
  }
  return filename
}

/**
 *
 * @param {string | null | undefined} filename
 */
function sanitizeFilename(filename) {
  if (!filename) {
    return null
  }
  if (!filename.endsWith(".mp4")) {
    return filename + ".mp4"
  } else {
    return filename
  }
}

run()

/**
 * TODO:
 * - move recordVideo to own file
 * - add screenshot capturing
 * - rename to android-capture
 */
