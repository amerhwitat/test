# VoiceConnect companion clients

The Java, Python and C++ programs are interoperable UTF-8 **room-chat clients** for the VoiceConnect signaling protocol. They send a display profile (nickname, per-client GUID and optional local avatar) immediately after joining, so the signaling service can attach the same identity to room-chat messages and participant events.

## Run

- Python 3.10+: `pip install -r clients/python/requirements.txt`, then `python clients/python/voiceconnect.py --url ws://127.0.0.1:8787/signal --room open-room-01 --nick "Ada" --avatar ./ada.png`.
- Java 17+: `javac -encoding UTF-8 clients/java/VoiceConnectChat.java`, then `java -cp clients/java VoiceConnectChat ws://127.0.0.1:8787/signal open-room-01 "Ada" ./ada.png`.
- C++17 + Boost.System: `cmake -S clients/cpp -B build && cmake --build build`, then `build/voiceconnect-chat 127.0.0.1 8787 open-room-01 "Ada" ./ada.png`.

Avatar is optional. Supported formats are PNG, JPEG, WebP and GIF, with a 36 KiB input limit. Each client encodes the selected local file as a bounded data URL and sends it only to the chosen room; the optional server-side profile/IP registry is not enabled by these clients. Nicknames are limited to 32 characters and are display labels, not authentication credentials. The user GUID distinguishes participants who choose the same nickname.

These companion clients remain **text-chat only**. They do not implement native camera, microphone, WebRTC media, or screen sharing. The browser/Electron client provides voice/video conferencing; compilation of the Java/Python/C++ chat clients does not validate native media functionality. Native media requires a separately integrated WebRTC stack (for example libwebrtc), platform device/audio adapters and device-level acceptance tests.

All chat text is transported as UTF-8 JSON. Use a UTF-8 terminal. The C++ sample currently uses plain ws://; deploy behind TLS/WSS for untrusted networks. These are minimal interoperability examples, not authenticated production clients.
