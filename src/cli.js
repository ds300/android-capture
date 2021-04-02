const { bold, grey } = require("kleur")
const meow = require("meow")

module.exports.cli = meow(
  `
  Usage

    $ npx android-capture video [<out-file>] [...options]
    $ npx android-capture image [<out-file>] [...options]

  Options

    ${bold("--copy")} ${grey("(image capture only)")}
      Copies the screenshot to the clipboard. Currently macOS only.

    ${bold("--full-res")}
      Record video in full resolution (may not work in emulators).
      Images are always full-resolution.

    ${bold("--open")}
      Open the file after saving

    ${bold("--no-countdown")}
      Prevent the 3..2..1.. countdown when recording video.

    ${bold("--help, -h")}
      Show this help text

    ${bold("--verbose")}
      Show verbose output

  Examples

    $ npx android-capture video

    $ npx android-capture video ./my-recording.mp4 --ful-res

    $ npx android-capture image --open
`,
  {
    flags: {
      help: {
        type: "boolean",
        default: false,
        alias: "h",
      },
      fullRes: {
        type: "boolean",
        default: false,
      },
      open: {
        type: "boolean",
        default: false,
      },
      countdown: {
        type: "boolean",
        default: true,
      },
      copy: {
        type: "boolean",
        default: false,
      },
      verbose: {
        type: "boolean",
        default: false,
      },
    },
    allowUnknownFlags: false,
  },
)
