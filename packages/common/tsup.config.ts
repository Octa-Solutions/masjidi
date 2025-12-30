import type { Options } from "tsup";

export const tsup: Options = {
  entry: ["src/index.ts", "src/providers.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: true,
  target: "node18",
  // @ts-expect-error process is global in node
  sourcemap: process.env.SOURCEMAP === "true",
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".js",
      dts: format === "cjs" ? ".d.cts" : ".d.ts",
    };
  },
};
