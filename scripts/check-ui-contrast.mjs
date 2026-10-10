import { readFileSync, writeFileSync } from "node:fs";

// Verify the actual theme tokens, without a browser or additional dependency.
// This is a palette check, not an assertion of whole-page accessibility.
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const roots = [...css.matchAll(/:root\s*\{([^}]+)\}/g)];
if (roots.length !== 2)
  throw new Error("Expected one light and one dark token block");
const tokens = (block) =>
  Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim(),
    ]),
  );
const light = tokens(roots[0][1]);
const dark = { ...light, ...tokens(roots[1][1]) };
for (const [, name] of css.matchAll(/var\(--([\w-]+)\)/g)) {
  if (!(name in light)) throw new Error(`Undefined CSS token: --${name}`);
}
const luminance = (hex) => {
  if (!/^#[\da-f]{6}$/i.test(hex))
    throw new Error(`Expected opaque RGB colour: ${hex}`);
  const rgb = [1, 3, 5].map(
    (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const [r, g, b] = rgb.map((v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (foreground, background) => {
  const a = luminance(foreground),
    b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const pairs = [];
const add = (foreground, backgrounds, minimum, kind) => {
  for (const background of backgrounds)
    pairs.push({ foreground, background, minimum, kind });
};
const surfaces = ["page", "surface", "surface-subtle", "success-surface"];
for (const foreground of ["text", "muted", "primary", "danger"])
  add(foreground, surfaces, 4.5, "text");
add("on-primary", ["primary", "primary-hover"], 4.5, "text");
add("success", ["success-surface"], 4.5, "text");
add("warning", ["warning-surface"], 4.5, "text");
add("danger", ["danger-surface"], 4.5, "text");
add("info", ["info-surface"], 4.5, "text");
add("control-border", surfaces, 3, "control");
add("danger", ["surface"], 3, "invalid input border");
add("primary", ["page", "surface"], 3, "primary control");
add(
  "focus-ring",
  [...surfaces, "warning-surface", "danger-surface", "info-surface"],
  3,
  "focus",
);

const results = [];
for (const [theme, palette] of Object.entries({ light, dark })) {
  for (const pair of pairs) {
    const ratio = contrast(palette[pair.foreground], palette[pair.background]);
    results.push({ theme, ...pair, ratio, passed: ratio >= pair.minimum });
  }
}
const failures = results.filter((result) => !result.passed);
console.table(
  failures.length
    ? failures
    : ["light", "dark"].map((theme) => {
        const checks = results.filter((result) => result.theme === theme);
        const worstText = Math.min(
          ...checks.filter((r) => r.minimum === 4.5).map((r) => r.ratio),
        );
        const worstControl = Math.min(
          ...checks.filter((r) => r.minimum === 3).map((r) => r.ratio),
        );
        return {
          theme,
          checks: checks.length,
          minimumText: worstText.toFixed(2),
          minimumControl: worstControl.toFixed(2),
          failures: 0,
        };
      }),
);
if (process.argv[2])
  writeFileSync(
    process.argv[2],
    JSON.stringify({ results, failures }, null, 2) + "\n",
  );
console.log(
  `${results.length - failures.length}/${results.length} theme contrast checks passed. Ratios are compared without rounding.`,
);
if (failures.length) process.exitCode = 1;
