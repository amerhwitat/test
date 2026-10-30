import fs from "node:fs";
import sharp from "sharp";
import pngToIco from "png-to-ico";
await fs.promises.mkdir("build",{recursive:true});
const svg=fs.readFileSync("icon.svg");
const png=await sharp(svg).resize(256,256).png().toBuffer();
fs.writeFileSync("build/icon.png",png);
fs.writeFileSync("build/icon.ico",await pngToIco(png));
