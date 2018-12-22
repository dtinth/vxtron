# vxtron

Electron version of [vxcli](https://github.com/dtinth/vxcli). It listens to my
voice and converts to text and copies it to the clipboard.

## Why

- I suffer from repetitive strain injury (osteoarthritis in the fingers, I
  guess), so, it helps a lot if I can type using my voice.

- I am not a native English speaker — macOS’s dictation fails to accurately
  recognize my voice accent.

- macOS’ Dictation does not have a public API that apps can use (not hackable).

- Google Cloud Text to speech enhanced voice models are much more accurate than
  macOS’ Dictation and the free webkitSpeechRecognition API.

## Setup

1. Create a Google Cloud platform project and enable billing on it.

2. Enable the Google Cloud speech API and turn on data logging.

3. [Set up authentication with a service account](https://cloud.google.com/docs/authentication/getting-started).

4. Clone this repository.

5. Create a `.env` file in the repo:

   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   ```

6. Install the dependencies for the Electron app:

   ```
   npm install
   ```

7. Install their dependencies for the React app, located in `vxgui` foler:

   ```
   (cd vxgui && yarn)
   ```

8. Build the React app:

   ```
   (cd vxgui && yarn build)
   ```

9. Run the Electron app:

   ```
   yarn start
   ```

## Usage

- Press **Cmd+Shift+L** to dictate English text. Press it again to make it stop
  listening.

- Press **Cmd+Alt+Shift+L** to dictate Thai text. Press it again to make it stop
  listening.

- As soon as you finished speaking the text that was recognized will be copied
  to the clipboard automatically.

- The app remembers the past texts that you have previously spoke, and you can
  use **Cmd+Alt+Up** and **Cmd+Alt+Down** to cycle through them. As you cycle
  through the history, the text that was recalled will also be copied to the
  clipboard automatically.

## Cost

I have to use the premium "video" voice model which is able to recognize my
voice with acceptable accuracy (none of the other models can do this). The model
is also much better at recognizing speech with a lot of technical terms,
compared to the default model.

It costs USD 0.048 per minute to use. The first 60 minutes per month are free.
