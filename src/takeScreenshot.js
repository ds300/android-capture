const { bold } = require("kleur")
const { adb } = require("./adb")

/**
 * @param {string} outFile
 */
module.exports.takeScreenshot = async (outFile) => {
  const internalFilePath = "/sdcard/android-capture-image.png"
  console.log("Taking screenshot...\n")
  adb("shell", "screencap", "-p", internalFilePath)
  adb("pull", internalFilePath, outFile)
  adb("shell", "rm", internalFilePath)
  console.log("Image saved to", bold(outFile))
}
