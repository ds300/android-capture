const countdownString = "3...2...1..."

module.exports.countdown = async () => {
  return new Promise((r) => {
    const startTime = Date.now()
    function tick() {
      const now = Date.now()
      const elapsed = now - startTime
      const ratio = elapsed / 3000
      const numCharsOfCountdownStringToUse = Math.floor(
        countdownString.length * ratio,
      )
      const countdownSoFar = countdownString.slice(
        0,
        numCharsOfCountdownStringToUse,
      )
      process.stdout.write(`    🎬 Get ready! ${countdownSoFar}\r`)
      if (ratio >= 1) {
        process.stdout.write("\033[K")
        clearInterval(interval)
        r(null)
      }
    }
    const interval = setInterval(tick, 50)
  })
}
