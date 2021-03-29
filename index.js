const { spawn } = require("child_process")
const { join } = require("path")

const chalk = require("kleur")
const { spawnSafeSync } = require("./src/spawnSafeSync")
const { getDevice } = require("./src/getDevice")

const version = require(join(__dirname, "./package.json")).version

console.log(chalk.bold("record-android-screen"), version)

// without this, we would only get streams once enter is pressed
process.stdin.setRawMode(true)

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
process.stdin.resume()
process.stdin.setEncoding("utf8")

/**
 * @returns {"1" | "0"}
 */
function getVisibleTouches() {
  // @ts-ignore
  return spawnSafeSync("adb", [
    "shell",
    "settings",
    "get",
    "system",
    "show_touches",
  ]).stdout.toString()
}

/**
 * @param {boolean} visible
 */
function setVisibleTouches(visible) {
  spawnSafeSync("adb", [
    "shell",
    "settings",
    "put",
    "system",
    "show_touches",
    visible ? "1" : "0",
  ])
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
const ENTER_KEYS = {
  // return
  "\r": true,
  // space
  " ": true,
}

/**
 * @param {string} outFile
 * @returns {Promise<void>}
 */
function recordVideo(outFile) {
  return new Promise((resolve, reject) => {
    const internalFilePath = `/sdcard/android-screen-recording.mp4`
    const recordProc = spawn("adb", ["shell", "screenrecord", internalFilePath])
    let err = ""
    recordProc.stderr.on("data", (data) => {
      err += data.toString()
    })
    let escaped = false
    recordProc.on("error", reject)
    recordProc.on("exit", async () => {
      if (err) {
        console.error(err)
      }
      process.stdin.removeListener("data", handleKeyPress)
      console.log("\n         ", chalk.green("✔"), "Cut! 🎬", "\n")
      console.log("Transferring video from phone...\n")
      await new Promise((r) => setTimeout(r, 2000))
      spawnSafeSync("adb", ["pull", internalFilePath, outFile])
      spawnSafeSync("adb", ["shell", "rm", internalFilePath])
      resolve()
    })
    console.log("\n         ", chalk.red("⦿"), "Recording...", "\n")
    printCallToAction()

    // on any data into stdin

    /**
     * @param {string} key
     */
    function handleKeyPress(key) {
      // ctrl-z
      if (key === "\u001a") {
        process.exit(1)
      }
      if (key in ESCAPE_KEYS) {
        escaped = true
        recordProc.kill("SIGTERM")
        process.stdin.removeListener("data", handleKeyPress)
      } else if (key in ENTER_KEYS) {
        recordProc.kill("SIGTERM")
        process.stdin.removeListener("data", handleKeyPress)
      } else {
        printCallToAction()
      }
      // write the key to stdout all normal like
    }
    process.stdin.on("data", handleKeyPress)
  })
}

/**
 * @param {string} label
 */
function printKey(label) {
  return chalk.gray("[") + label + chalk.gray("]")
}
function printCallToAction() {
  console.log(
    "Press",
    printKey(chalk.bold().green("SPACE")),
    "to finish recording, or",
    printKey("ESC"),
    "to cancel.",
  )
}

async function run() {
  const device = await getDevice()
  console.log({device})
  process.exit(1)
  const outPath = "./recording.mp4"
  setVisibleTouches(true)

  try {
    await recordVideo(outPath)
    console.log("That's a wrap!", chalk.bold(outPath))
    console.log()
  } catch (e) {
    console.error(e)
  }

  setVisibleTouches(false)

  process.exit(0)
}

run()
// getVisibleTouches()
