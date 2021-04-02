#! /usr/bin/env node

const { join } = require("path")

const { init } = require("./src/adb")
const { existsSync } = require("fs")
const { cli } = require("./src/cli")
const { normalize } = require("path")
const { recordVideo } = require("./src/recordVideo")
const { takeScreenshot } = require("./src/takeScreenshot")
const open = require("open")
const { bold, gray } = require("kleur")
const { selectOption } = require("./src/selectOption")
const logUpdate = require("log-update")
const { fail } = require("./src/log")

const version = require(join(__dirname, "./package.json")).version

console.log(bold().gray("android-capture"), gray(version), "\n")

/**
 * @type {Record<string, boolean>}
 */
const videoTypes = {
  video: true,
  movie: true,
  mp4: true,
}

/**
 * @type {Record<string, boolean>}
 */
const imageTypes = {
  image: true,
  screenshot: true,
  still: true,
  picture: true,
  png: true,
}

/**
 * @param {any} message
 */
function error(message) {
  fail(message, "\nRun with", bold("--help"), "for usage information.")
}

async function run() {
  try {
    const [type = "", filename, ...others] = cli.input

    /**
     * @type {"video" | "image" | null}
     */
    let mode =
      type in imageTypes ? "image" : type in videoTypes ? "video" : null

    if (!mode) {
      const idx = await selectOption("What do you want to capture?", [
        "Video",
        "Screenshot",
      ])
      mode = idx === 0 ? "video" : "image"
      logUpdate(
        `💡 Hint! In the future you can run ${bold(
          `npx android-capture ${mode}`,
        )}\n`,
      )
      logUpdate.done()
      await new Promise((r) => setTimeout(r, 1000))
    }

    if (others.length) {
      error("Unexpected arguements: " + others.join(" "))
    }

    const extension = mode === "image" ? "png" : "mp4"
    const defaultFilename =
      mode === "image" ? "android-screenshot" : "android-video"

    const outPath = normalize(
      sanitizeFilename(filename, extension) ||
        generateFilename(defaultFilename, extension),
    )

    if (cli.flags.copy && mode === "video") {
      error(`The ${bold("--copy")} option does not work with video.`)
    }

    const useTemporaryFile = !filename && cli.flags.copy && !cli.flags.open

    await init()

    if (mode === "video") {
      await recordVideo(outPath)
    } else {
      await takeScreenshot(outPath, useTemporaryFile)
    }

    if (cli.flags.open) {
      open(outPath)
    }

    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

/**
 * @param {string} name
 * @param {string} extension
 */
function generateFilename(name, extension) {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  let filename = `./${name}.${year}-${month}-${day}.00.${extension}`
  let i = 1
  while (existsSync(filename)) {
    filename = `./${name}.${year}-${month}-${day}.${i
      .toString()
      .padStart(2, "0")}.${extension}`
    i++
  }
  return filename
}

/**
 *
 * @param {string | null | undefined} filename
 * @param {string} extension
 */
function sanitizeFilename(filename, extension) {
  if (!filename) {
    return null
  }
  if (!filename.endsWith("." + extension)) {
    return filename + "." + extension
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
