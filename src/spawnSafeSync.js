/**
 * @typedef {{ failOnError?: boolean, maxBuffer?: number} & import('child_process').SpawnOptions} SpawnSafeOptions
 */

/** @type {SpawnSafeOptions} */
const defaultOptions = {
  failOnError: true,
}

const { spawnSync } = require("child_process")
const { gray } = require("kleur")
const { verbose, fail, formatSpawnArgs } = require("./log")

class ConsoleError {
  /**
   * @param {import('node:child_process').SpawnSyncReturns<Buffer>} result
   */
  constructor(result) {
    this.result = result
  }
}
module.exports.ConsoleError = ConsoleError

module.exports.spawnSafeSync = (
  /** @type {string} */ command,
  /** @type {string[]} */ args,
  /** @type {SpawnSafeOptions} */ options,
) => {
  verbose(`${gray("$")} ${command} ${formatSpawnArgs(args)}`)
  const mergedOptions = Object.assign({}, defaultOptions, options)
  const result = spawnSync(command, args, options)
  if (result.error || result.status !== 0) {
    if (mergedOptions.failOnError) {
      const err = result.stderr ? result.stderr.toString() : ""
      const out = result.stdout ? result.stdout.toString() : ""
      fail(
        `Command failed: ${command} ${formatSpawnArgs(args)}`,
        ...[err, out, result.error].filter(Boolean),
      )
    }
  }
  return result
}
