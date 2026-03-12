/**
 * Script para gerar ícones do app a partir do SVG
 * Gera: resources/icon.png (1024x1024), resources/icon.ico (Windows), resources/icon.icns (Mac)
 */

import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";
import png2icons from "png2icons";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const resourcesDir = join(rootDir, "resources");

if (!existsSync(resourcesDir)) {
  mkdirSync(resourcesDir, { recursive: true });
}

const svgContent = readFileSync(
  join(rootDir, "src", "renderer", "src", "assets", "images", "logo.svg"),
  "utf8",
);

// Tamanhos necessários
const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

console.log("Gerando ícones...");

// Gerar PNG em cada tamanho
const pngBuffers = {};
for (const size of sizes) {
  const resvg = new Resvg(svgContent, {
    fitTo: { mode: "width", value: size },
  });
  const rendered = resvg.render();
  pngBuffers[size] = rendered.asPng();
  console.log(`  ✓ PNG ${size}x${size}`);
}

// Salvar o PNG principal de 1024x1024
writeFileSync(join(resourcesDir, "icon.png"), pngBuffers[1024]);
console.log("  ✓ resources/icon.png (1024x1024)");

// Gerar ICO para Windows (múltiplos tamanhos)
const icoSizes = [16, 32, 48, 64, 128, 256];
const icoPngBuffers = icoSizes.map((s) => pngBuffers[s]);

try {
  const icoBuffer = await pngToIco(icoPngBuffers);
  writeFileSync(join(resourcesDir, "icon.ico"), icoBuffer);
  console.log("  ✓ resources/icon.ico (Windows)");
} catch (err) {
  console.error("  ✗ Falha ao gerar ICO:", err.message);
}

// Para macOS (ICNS) - gerado a partir do PNG de 1024x1024
try {
  const icnsBuffer = png2icons.createICNS(
    pngBuffers[1024],
    png2icons.BILINEAR,
    0,
  );
  if (icnsBuffer) {
    writeFileSync(join(resourcesDir, "icon.icns"), icnsBuffer);
    console.log("  ✓ resources/icon.icns (macOS)");
  }
} catch (err) {
  console.error("  ✗ Falha ao gerar ICNS:", err.message);
}

// Para macOS (ICNS) - electron-builder pode gerar a partir do PNG de 1024x1024
// Mas vamos copiar o PNG como fallback
writeFileSync(join(resourcesDir, "icon-1024.png"), pngBuffers[1024]);
console.log("  ✓ resources/icon-1024.png (para geração do ICNS)");

console.log("\nÍcones gerados com sucesso em ./resources/");
