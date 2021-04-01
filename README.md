# android-capture

<p align="center">
  <img src="https://ds300.github.io/android-capture/android-capture.gif" width="80%" alt="android-capture demo" />
</p>

`android-capture` makes it easy to capture video and screenshots from Android devices and emulators.


## Usage

```sh
$ npx android-capture video [<output-filename>] [...options]
```

or

```sh
$ npx android-capture image [<output-filename>] [...options]
```

### Prerequisites

You need to have the Android developer tools installed. In particular, [adb](https://developer.android.com/studio/command-line/adb) must be installed and in your path (i.e. `which adb` should have exit status 1).

If you want to capture from a physical device, the device must be paired with your computer via [USB debugging](https://developer.android.com/studio/command-line/adb#Enabling) or [Wireless debugging](https://developer.android.com/studio/command-line/adb#connect-to-a-device-over-wi-fi-android-11+)

### Options

- `--copy` (Screenshots only, macOS only)

  Copies the screenshot to the clipboard. If no output path is given, no file will be saved.

- `--full-res` (Video only)

  Records video in full-resolution. By default `android-capture` reduces the video resolution by 50%, which still offers great quality screen recording.

  May not work with emulators.

- `--open`

  Opens the file after saving.

- `--no-countdown` (Video only)

  Skips the '3...2...1...' countdown before starting to record.
