const { bold, bgRed } = require("kleur")
const { adbAsync } = require("./adb")
const { cli } = require("./cli")
const { tmpdir, platform } = require("os")
const { join, basename } = require("path")
const { unlinkSync, createWriteStream } = require("fs")
const { spawnSafeSync } = require("./spawnSafeSync")
const { fail } = require("./log")

/**
 * @param {string} outFile
 * @param {boolean} useTemporaryFile
 */
module.exports.takeScreenshot = async (outFile, useTemporaryFile) => {
  const outputFilePath = useTemporaryFile
    ? join(tmpdir(), basename(outFile))
    : outFile
  console.log("Taking screenshot...\n")
  const proc = adbAsync("exec-out", "screencap", "-p")
  proc.stdout.pipe(createWriteStream(outputFilePath))

  let err = ""
  proc.stderr.on("data", (data) => {
    err += data.toString()
  })
  proc.on("error", (error) => {
    fail("Could not capture image", [error, err].filter(Boolean))
  })
  await new Promise((r) => {
    proc.on("exit", r)
  })
  if (err) {
    fail("Could not capture image", err)
  }

  if (cli.flags.copy) {
    if (platform() === "darwin") {
      spawnSafeSync(join(__dirname, "copy-image-macos"), [outputFilePath])
      console.log("Image copied to clipboard!\n")
    } else {
      console.error(
        bgRed(" ERROR "),
        "--copy option currently only works on macOS.",
      )
      console.error(
        "Contribute support for other platforms at\n\n    https://github.com/ds300/android-capture\n",
      )
    }
  }
  if (useTemporaryFile) {
    unlinkSync(outputFilePath)
  } else {
    console.log("Image saved to", bold(outFile))
  }
}
