import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const logBrainstorm = mutation({
  args: {
    brainstormIdea: v.string(),
    contributions: v.array(v.object({
      daemonName: v.string(),
      role: v.string(),
      highlight: v.string(),
    })),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("managerLogs", {
      brainstormIdea: args.brainstormIdea,
      contributions: args.contributions,
      createdAt: args.now,
    } as any);
    return id;
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("managerLogs").collect();
  },
});