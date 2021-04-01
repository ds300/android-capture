const { red, green, bold, gray } = require("kleur")
const logUpdate = require("log-update")
const { adb, adbAsync } = require("./adb")
const { cli } = require("./cli")
const { countdown } = require("./countdown")
const { pushKeyboardContext, popKeyboardContext } = require("./keyboardInput")
const { getVisibleTouches, setVisibleTouches } = require("./visibleTouches")

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

const ENTER_KEYS = {
  // return
  "\r": true,
  // space
  " ": true,
}

/**
 * @param {string} outFile
 */
module.exports.recordVideo = async (outFile) => {
  await countdown()

  const hasVisibleTouchesByDefault = getVisibleTouches()

  setVisibleTouches(true)

  try {
    const result = await createRecording(outFile)
    if (!result.escaped) {
      console.log("That's a wrap!", bold(outFile))
    }
    console.log()
  } catch (e) {
    console.error("failed in main loop", e)
  }

  setVisibleTouches(hasVisibleTouchesByDefault)
}

/**
 * @param {string} outFile
 * @returns {Promise<{escaped: boolean}>}
 */
async function createRecording(outFile) {
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
          `          ${green("✔")} Cut!\n\nTransferring video from phone...`,
        )
        await new Promise((r) => setTimeout(r, 2000))
        console.log()
        adb("pull", internalFilePath, outFile)
      } else {
        logUpdate(`          ${bold().red("♺")} Cancelling...\n\n`)
      }
      adb("shell", "rm", internalFilePath)
      resolve({ escaped })
    })

    pushKeyboardContext({
      handleEscape() {
        escaped = true
        recordProc.kill("SIGTERM")
        popKeyboardContext()
      },
      handleKeyPress(key) {
        if (key in ENTER_KEYS) {
          recordProc.kill("SIGTERM")
          popKeyboardContext()
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
    logUpdate(`          ${this.toggle ? red("⦿") : " "} Recording...

Press ${printKey(bold().green("SPACE"))} to finish recording, or ${printKey(
      "ESC",
    )} to cancel.`)
    this.toggle = !this.toggle
  }
}

/**
 * @param {string} label
 */
function printKey(label) {
  return gray("[") + label + gray("]")
}
