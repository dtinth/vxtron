# vxtron

A little application listens to my voice and converts to text and copies it to
the clipboard. Built using Electron.

## Why

- I suffer from repetitive strain injury (osteoarthritis in the fingers, I
  guess), so, it helps a lot if I can type using my voice.

- I am not a native English speaker — macOS’s dictation fails to accurately
  recognize my voice accent.

- macOS’ Dictation does not have a public API that apps can use (not hackable).

- Google Cloud Text to speech enhanced voice models are much more accurate than
  macOS’ Dictation and the free webkitSpeechRecognition API. It also comes with
  automatic punctuation insertion, which means it can automatically add full
  stops, commas, and question marks.

## Supported speech recognizers

`vx` support pluggable speech recognizers. You can choose to use one of the
following:

- **Google Chrome’s webkitSpeechRecognition** (free, default)

  - Can be used free of charge
  - No time limit
  - Requires opening a browser tab in background
  - Recognition quality is not so great
  - No automatic punctuation insertion

- **Google Speech-To-Text API** (paid)

  - Much better recognition accuracy for English language
  - Automatically adds punctuation marks
  - Does not require opening a browser tab in background
  - Costs money
  - Each session is limited to 60 seconds

## Development setup

1. Clone this repository.

2. Install the dependencies for the Electron app:

   ```
   yarn
   ```

3. Install the dependencies for the React app, located in `vxgui` foler:

   ```
   (cd vxgui && yarn)
   ```

4. Build the React app:

   ```
   (cd vxgui && yarn build)
   ```

5. Build an `.app` bundle:

   ```
   yarn build
   ```

## Configuration with Google Chrome

Google Chrome provides the webkitSpeechRecognition API which is available for
free. However it can only be used inside Google Chrome (which means it is
[not available in other Chromium-based environment, including Electron](https://stackoverflow.com/questions/36214413/webkitspeechrecognition-returning-network-error-in-electron)).
`vx` uses a hacky workaround by launching Google Chrome to a webpage which helps
expose the webkitSpeechRecognition API to the Electron app via socket.io.

1. This is the default behavior; you don't need to configure anything to use
   this mode.

2. You can configure more options by creating `~/.vxrc.yml` in the home
   directory with the following configuration:

   ```yml
   speechProvider: chrome
   speechProviderOptions:
     port: 5555
     openBrowser: false # default: true
     app: Google Chrome # see: https://www.npmjs.com/package/opn#app
   ```

## Configuration with Google Cloud Speech-To-Text

1. Create a Google Cloud platform project and enable billing on it.

2. Go to
   [Google Cloud API library](https://console.cloud.google.com/apis/library) and
   enable the Google Cloud Speech API.

3. To get access to enhanced voice models,
   [turn on data logging](https://console.cloud.google.com/apis/api/speech.googleapis.com/data_logging).

4. [Set up authentication with a service account](https://cloud.google.com/docs/authentication/getting-started).
   Download a service account file and save it to your computer.

5. Create `~/.vxrc.yml` with the following configuration:

   ```yml
   speechProvider: google-cloud
   speechProviderOptions:
     serviceAccount: /path/to/service-account.json
     recordProgram: /usr/bin/rec
   ```

   - `serviceAccount` is the full path to your service account file
   - `recordProgram` is the full path to [SoX’s](http://sox.sourceforge.net/)
     `rec` executable.

## Usage

- Launch the Electron app at `dist/mac/vxtron.app`.

- Press **Cmd+Shift+L** to dictate English text. Press it again to make it stop
  listening.

- Press **Cmd+Alt+Shift+L** to dictate Thai text. Press it again to make it stop
  listening.

- As soon as you finish speaking, the recognized text will be copied to the
  clipboard automatically.

- The app remembers the past texts (not persistent), and you can use
  **Cmd+Alt+Up** and **Cmd+Alt+Down** to cycle through them. As you cycle
  through the history, the recalled text will also be copied to the clipboard
  automatically.

## Development

### Developing the GUI

A browser-based development environment is available. It is purely browser-based
and doesn't use Electron APIs or Google Cloud Speech-To-Text. Instead, it uses
the `webkitSpeechRecognition` API to recognize your voice.

This means it doesn't cost anything while development, but recognition accuracy
will suffer, and automatic punctuation insertion will not be available.

1. Run `yarn start` in `vxgui` directory:

   ```
   (cd vxgui && yarn start)
   ```

2. This will launch create-react-app development server. A browser should open
   to `localhost:3000` automatically. Make sure you are using **Google Chrome**
   (otherwise the speech recognition API will not be available).

3. The key bindings are the same, except that you use **Ctrl** instead of
   **Cmd** key. For example, press **Ctrl+Alt+L** to listen to text.

   The accelerator key is changed to prevent conflict between the development
   version and the electron version, which may be running at the same time.

4. The copy functionality will not work because a webapp may not copy stuff to
   the clipboard without a user interaction. However, this can be circumvented
   by exposing Chrome DevTool’s `copy` function into the webapp. You can do that
   by running the following command in the JavaScript console:

   ```js
   copy('...')
   Object.assign(window, { copy })
   ```

### Building the GUI as a static HTML file for electron

Once you finish developing, run `yarn build` in `vxgui` directory.

```
(cd vxgui && yarn build)
```

This will build the files into the `vxgui/build` directory.

### Testing the development app in Electron

Sometimes, you really need to test some Electron-specific APIs, and having to
rebuild a bundle every time we want to test it is not ideal.

Alternatively, with the development server running, you can run the Electron app
with an environment variable `VX_DEV=1` to make the Electron app load the app
from `localhost:3000` instead of the built files.

```
VX_DEV=1 yarn start
```

## Architecture

There are two main components in this project:

1. The web application, built using React and TypeScript.

   - It contains the core application logic, such as how the transcript from the
     speech recognition service is handled.
   - It is designed to run both in Browser environment (for development) and
     Electron environment (for actual use).

   | Environment            | Browser                     | Electron                    |
   | ---------------------- | --------------------------- | --------------------------- |
   | Use case               | For development             | For real-world usage        |
   | Display                | As a web app                | As an overlay HUD           |
   | Activation             | Only inside web app         | Available system-wide       |
   | Speech recognition API | webkitSpeechRecognition API | Google Cloud Speech-To-Text |
   | Recognition quality    | Not so accurate for me      | Very accurate               |
   | Automatic punctuation  | Not supported               | Supported                   |
   | Cost of usage          | Free                        | \$0.048/min                 |

2. The electron application

- Provides the overlay GUI.
- Provides access to global hotkeys
- Provides access to Google Cloud Speech APIs.

## Cost

I have to use the premium "video" voice model which is able to recognize my
voice with acceptable accuracy (none of the other models can do this). The model
is also much better at recognizing speech with a lot of technical terms,
compared to the default model.

It costs USD 0.048 per minute to use. The first 60 minutes per month are free.

When the speech API is being used, vx keeps track of its usage log in
`~/.vx-google-cloud-speech.log`. It is a TSV file with 3 columns:

1. Timestamp
2. Usage in seconds, rounded up.
3. The pricing plan (1: normal speech recognition at
   $0.024/min, 2: enhanced video speech recognition at $0.048/min).

There is also a simple Ruby script that displays a summary of how much is spent
on this API per day. You can run it using `ruby cost.rb`.
