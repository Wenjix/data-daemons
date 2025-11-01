import { ConvexReactClient } from "convex/react";

// Allow configuration via Vite env; fallback to common local dev port
const url = import.meta.env.VITE_CONVEX_URL ?? "http://127.0.0.1:8187";
export const convex = new ConvexReactClient(url);