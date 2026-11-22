import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#14213d", paper: "#f6f7f9", brand: "#0f766e" } } }, plugins: [] } satisfies Config;
