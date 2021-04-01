const { bold, bgRed } = require("kleur")
const { adb } = require("./adb")
const { cli } = require("./cli")
const { tmpdir, platform } = require("os")
const { join, basename } = require("path")
const { unlinkSync } = require("fs")
const { spawnSafeSync } = require("./spawnSafeSync")

/**
 * @param {string} outFile
 * @param {boolean} useTemporaryFile
 */
module.exports.takeScreenshot = async (outFile, useTemporaryFile) => {
  const internalFilePath = "/sdcard/android-capture-image.png"
  const externalFilePath = useTemporaryFile
    ? join(tmpdir(), basename(outFile))
    : outFile
  console.log("Taking screenshot...\n")
  adb("shell", "screencap", "-p", internalFilePath)
  adb("pull", internalFilePath, externalFilePath)
  adb("shell", "rm", internalFilePath)
  if (cli.flags.copy) {
    if (platform() === "darwin") {
      spawnSafeSync(join(__dirname, "copy-image-macos"), [externalFilePath])
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
    unlinkSync(externalFilePath)
  } else {
    console.log("Image saved to", bold(outFile))
  }
}
