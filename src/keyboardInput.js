// without this, we would only get streams once enter is pressed
process.stdin.setRawMode(true)

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
process.stdin.resume()
process.stdin.setEncoding("utf8")

/**
 * @type {Record<string, true>}
 */
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

/**
 * @typedef {{handleEscape?(): void, handleKeyPress(key: string): void}} HandleContext
 */

/**
 * @type {HandleContext[]}
 */
const handlers = []

module.exports.pushKeyboardContext = (
  /** @type {HandleContext} */ handleContext,
) => {
  handlers.push(handleContext)
}
module.exports.popKeyboardContext = () => {
  handlers.pop()
}

function handleEscape() {
  const handle = handlers[handlers.length - 1]?.handleEscape
  if (handle) {
    handle()
  } else {
    process.exit(1)
  }
}

process.stdin.addListener("data", (key) => {
  const char = key.toString()
  if (ESCAPE_KEYS[char]) {
    handleEscape()
  } else {
    handlers[handlers.length - 1]?.handleKeyPress?.(char)
  }
})

process.on("SIGTERM", handleEscape)
process.on("SIGINT", handleEscape)
process.on("SIGTSTP", handleEscape)
process.on("SIGQUIT", handleEscape)

process.on("SIGHUP", () => {
  process.exit(1)
})
