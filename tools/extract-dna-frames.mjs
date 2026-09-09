/**
 * One-off asset pipeline: DNA footage -> brand-duotoned WebP frame sequence.
 *
 * The runtime scrubs these frames on scroll, so they are pre-graded here and the
 * page only has to drawImage(). Re-run this script to retune the colour ramp.
 *
 *   node tools/extract-dna-frames.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ffmpeg = require("@ffmpeg-installer/ffmpeg").path;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "359530_medium (1).mp4");
const OUT_DIR = path.join(root, "assets", "dna");

// --- tunables -------------------------------------------------------------
const FRAMES = 150;            // frames across the full 20s rotation
const SRC_DURATION = 20.02;
const CROP_W = 640;            // helix occupies the middle ~50% of the 1280px source
const CROP_H = 720;
const CROP_X = 320;            // centred on the helix (bright columns peak at ~53% width)
const CROP_Y = 0;
const OUT_W = 480;
const OUT_H = 540;
const QUALITY = 62;

/**
 * Chroma key, then brand duotone.
 *
 * The stock footage layers the helix over chemistry line-art, floating numbers and
 * data readouts. A luminance threshold cannot separate them because that clutter is
 * drawn in bright white. The helix is cyan, the clutter is neutral, so key on chroma
 * instead: (G+B)/2 - R is large for cyan and ~0 for anything white or grey.
 * That isolates the helix and drops the rest to pure black, which `mix-blend-mode:
 * screen` then erases entirely.
 */
const CHROMA_GAIN = 3.0;

/**
 * Duotone ramp applied to the keyed mask.
 *   0.00 -> #000000  (background + clutter, gone under screen blend)
 *   0.55 -> #4F8F8E  Muted Teal
 *   0.80 -> #B7D6D2  Pale Teal
 *   1.00 -> #C7742D  Copper, only the brightest cores
 */
const CURVE_R = "0/0 0.54/0 0.70/0.310 0.86/0.718 1/0.780";
const CURVE_G = "0/0 0.54/0 0.70/0.561 0.86/0.839 1/0.455";
const CURVE_B = "0/0 0.54/0 0.70/0.557 0.86/0.824 1/0.176";
// --------------------------------------------------------------------------

if (!fs.existsSync(SRC)) {
  console.error("Source video not found: " + SRC);
  process.exit(1);
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const fps = (FRAMES / SRC_DURATION).toFixed(4);

// Keep a pixel only if it is BOTH bright and cyan. Luminance alone keeps the white
// chemistry line-art; cyan-ness alone keeps the dark teal-tinted background. The
// min() of the two keeps just the helix.
const luma = "(0.299*r(X,Y)+0.587*g(X,Y)+0.114*b(X,Y))";
const cyan = `(((g(X,Y)+b(X,Y))/2-r(X,Y))*${CHROMA_GAIN})`;
const chroma = `clip(min(${luma},${cyan}),0,255)`;

const filter = [
  `crop=${CROP_W}:${CROP_H}:${CROP_X}:${CROP_Y}`,
  `fps=${fps}`,
  `scale=${OUT_W}:${OUT_H}`,
  "format=rgb24",
  `geq=r='${chroma}':g='${chroma}':b='${chroma}'`,
  `curves=r='${CURVE_R}':g='${CURVE_G}':b='${CURVE_B}'`,
].join(",");

console.log("Extracting " + FRAMES + " frames at " + OUT_W + "x" + OUT_H + " (fps=" + fps + ")...");

const res = spawnSync(
  ffmpeg,
  [
    "-v", "error",
    "-i", SRC,
    "-vf", filter,
    "-frames:v", String(FRAMES),
    "-c:v", "libwebp",
    "-quality", String(QUALITY),
    "-compression_level", "6",
    path.join(OUT_DIR, "frame_%04d.webp"),
  ],
  { stdio: "inherit" }
);

if (res.status !== 0) {
  console.error("ffmpeg failed with status " + res.status);
  process.exit(1);
}

const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".webp"));
const bytes = files.reduce((sum, f) => sum + fs.statSync(path.join(OUT_DIR, f)).size, 0);
const mb = bytes / 1024 / 1024;

console.log(`Wrote ${files.length} frames, ${mb.toFixed(2)} MB total (${Math.round(bytes / files.length / 1024)} KB avg)`);
if (mb > 4) console.warn("Over the 4MB budget - lower QUALITY or OUT_W/OUT_H and re-run.");
