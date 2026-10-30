const base = require("./package.json").build;
module.exports = {
  ...base,
  productName: "VoiceConnect P2P OpenGL",
  directories: { ...base.directories, output: "dist/opengl" },
  extraMetadata: { main: "electron-main-opengl.cjs" }
};
