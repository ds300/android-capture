const { adb } = require("./adb")

/**
 * @returns {boolean}
 */
module.exports.getVisibleTouches = () => {
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

/**
 * @param {boolean} visible
 */
module.exports.setVisibleTouches = (visible) => {
  adb("shell", "settings", "put", "system", "show_touches", visible ? "1" : "0")
}
