import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const source = resolve("public/icons/icon-source.png");
const sizes = [16, 32, 48, 128];

await mkdir(dirname(source), { recursive: true });

await Promise.all(
  sizes.map(async (size) => {
    await sharp(source)
      .resize(size, size, {
        fit: "contain"
      })
      .png()
      .toFile(resolve(`public/icons/icon-${size}.png`));
  })
);

console.log(`Generated ${sizes.length} extension icons.`);
