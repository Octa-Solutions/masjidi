import type { Options } from "tsup";

export const tsup: Options = {
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: true,
  target: "node18",
  // @ts-expect-error process is global in node
  watch: process.env.WATCH === "true",
  // @ts-expect-error process is global in node
  sourcemap: process.env.SOURCEMAP === "true",
  noExternal: ["get-pixels"],
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".js",
      dts: format === "cjs" ? ".d.cts" : ".d.ts",
    };
  },
};
