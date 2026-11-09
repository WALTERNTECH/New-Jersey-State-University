import sharp from "sharp";
const src = "logo-src.jpg";
const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
console.log(info.width, info.height, "bg", px(5, 5), "gold", px(250, 175));
// Crest only (laurel + cap + book), square
await sharp(src).extract({ left: 110, top: 90, width: 280, height: 260 }).resize(512, 476).png().toFile("public/crest.png");
await sharp(src).png().toFile("public/logo-full.png");
await sharp(src).extract({ left: 110, top: 90, width: 280, height: 280 }).resize(256, 256).png().toFile("public/icon.png");
await sharp(src).extract({ left: 110, top: 90, width: 280, height: 280 }).resize(180, 180).png().toFile("public/apple-icon.png");
