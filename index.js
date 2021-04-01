const { join } = require("path")

const chalk = require("kleur")
const { init } = require("./src/adb")
const { existsSync } = require("fs")
const { countdown } = require("./src/countdown")
const { cli } = require("./src/cli")
const { normalize } = require("path")
const { setVisibleTouches, getVisibleTouches } = require("./src/visibleTouches")
const { recordVideo } = require("./src/recordVideo")

const version = require(join(__dirname, "./package.json")).version

console.log(chalk.bold("record-android-screen"), version, "\n")

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
 * - add screenshot capturing
 * - rename to android-capture
 */
