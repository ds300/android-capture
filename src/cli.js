const meow = require("meow")

module.exports.cli = meow(
  `
  Usage
    $ npx record-android-screen [<out-file>] [...options]

  Options
    --full-res       Record in full resolution (may not work in emulators)
    --open           Open the video after saving
    --no-countdown   Prevent the 3..2..1.. countdown
    --help, -h       Show this help text

  Examples
    $ npx record-android-screen

    $ npx record-android-screen ./my-recording.mp4

    $ npx record-android-screen --open
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
    },
    allowUnknownFlags: false,
  },
)
