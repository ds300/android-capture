/**
 * @typedef {{ throwOnError?: boolean, logStdErrOnError?: boolean, maxBuffer?: number} & import('child_process').SpawnOptions} SpawnSafeOptions
 */

/** @type {SpawnSafeOptions} */
const defaultOptions = {
  logStdErrOnError: true,
  throwOnError: true,
}

const { spawnSync } = require("child_process")

module.exports.spawnSafeSync = (
  /** @type {string} */ command,
  /** @type {string[]} */ args,
  /** @type {SpawnSafeOptions} */ options,
) => {
  const mergedOptions = Object.assign({}, defaultOptions, options)
  const result = spawnSync(command, args, options)
  if (result.error || result.status !== 0) {
    if (mergedOptions.logStdErrOnError) {
      if (result.stderr) {
        console.error(result.stderr.toString())
      } else if (result.error) {
        console.error(result.error)
      }
    }
    if (mergedOptions.throwOnError) {
      throw result
    }
  }
  return result
}
