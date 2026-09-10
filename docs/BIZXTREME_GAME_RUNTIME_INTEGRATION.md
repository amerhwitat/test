# BizXtreme Game Runtime Integration

The `test` repository is the Web UI integration hub for the BizXtreme/Aurora experience.

## Runtime contracts

- Dashboard KPIs: score, XP, expedition, play time, peer count, rank.
- Local save/resume: versioned browser storage with offline operation.
- Hall of Fame: local-first records; authoritative global scores require trusted validation.
- Peer discovery: explicit opt-in directory using pseudonymous peer IDs.
- P2P transport: WebRTC data channels for game/chat payloads; signaling and ICE infrastructure remain separate.
- Privacy: no public-Internet scanning and no raw player-IP database in the client.
- Splash: logical asset ID `bizxtreme-aurora-frontier`, with Aurora/Chimera Library artwork as the design source.

## Platform alignment

Web UI, Three.js, Unity and native Chimera clients should keep the same JSON field names and state transitions so a saved expedition can be migrated between compatible clients in the future.
