const { cyan, gray, bold } = require("kleur")
const logUpdate = require("log-update")
const { pushKeyboardContext, popKeyboardContext } = require("./keyboardInput")

/**
 * @param {string} title
 * @param {string[]} options
 * @returns {Promise<number>}
 */
module.exports.selectOption = async function selectOption(title, options) {
  return new Promise((resolve) => {
    let selection = 0
    const draw = () => {
      const lines = ["          " + bold(` ${title} `), ""]
      for (let i = 0; i < options.length; i++) {
        lines.push(
          "  " +
            (i === selection
              ? cyan().bold("• " + options[i])
              : gray("• ") + options[i]),
        )
      }
      lines.push("", "Use up/down arrow keys and hit [ENTER]")
      logUpdate(lines.join("\n"))
    }

    draw()
    pushKeyboardContext({
      handleKeyPress(key) {
        if (key === "\r") {
          // enter!
          popKeyboardContext()
          logUpdate()
          resolve(selection)
        } else if (key === "\u001b[B") {
          // arrow down!
          selection = Math.min(selection + 1, options.length - 1)
          draw()
        } else if (key === "\u001b[A") {
          // arrow up!
          selection = Math.max(selection - 1, 0)
          draw()
        }
      },
    })
  })
}
