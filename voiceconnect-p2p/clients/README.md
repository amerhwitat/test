# Native companion clients

These Java, Python and C++ programs are interoperable UTF-8 **room-chat clients** for the VoiceConnect signaling protocol. They are not yet native camera/microphone/WebRTC implementations. The browser/Electron application remains the voice/video implementation. Native media would require a separately integrated WebRTC stack (for example libwebrtc) and platform device/audio adapters; these clients do not claim that feature.

- Python 3.10+: `python -m pip install -r clients/python/requirements.txt`, then `python clients/python/voiceconnect.py --room open-room-01`.
- Java 17+: `javac -encoding UTF-8 clients/java/VoiceConnectChat.java`, then `java -cp clients/java VoiceConnectChat ws://127.0.0.1:8787/signal open-room-01`.
- C++17 + Boost.System: `cmake -S clients/cpp -B build && cmake --build build`; run `build/voiceconnect-chat 127.0.0.1 8787 open-room-01`.

All chat text is transported as UTF-8 JSON. Use a UTF-8 terminal. The C++ sample currently uses plain ws://; deploy behind TLS/WSS for untrusted networks. These are minimal interoperability examples, not authenticated production clients.
