const base = require("./package.json").build;
module.exports = {
  ...base,
  productName: "VoiceConnect P2P DirectX 11",
  directories: { ...base.directories, output: "dist/directx" },
  extraMetadata: { main: "electron-main-directx.cjs" }
};
