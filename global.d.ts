// Ambient declaration so TypeScript accepts CSS side-effect imports (e.g. import "./globals.css").
// Next.js handles the actual loading; this just satisfies the type-checker.
declare module "*.css";
