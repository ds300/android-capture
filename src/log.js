const { bgRed } = require("kleur")
const logUpdate = require("log-update")
const { cli } = require("./cli")

/**
 * @param {string} msg
 * @param {...any} others
 */
module.exports.fail = (msg, ...others) => {
  logUpdate.done()
  console.error(bgRed(" ERROR "), msg)
  if (others.length) {
    console.error(...others)
  }
  process.exit(1)
}

/**
 * @param  {...any} args
 */
module.exports.verbose = (...args) => {
  if (cli.flags.verbose) {
    logUpdate.done()
    console.log(...args)
  }
}

/**
 * @param {string[]} args
 */
module.exports.formatSpawnArgs = (args) => {
  return args
    .map((a) => (a.match(/^[\w\-]+$/) ? a : `'${a.replace(/'/g, `'\\''`)}'`))
    .join(" ")
}
