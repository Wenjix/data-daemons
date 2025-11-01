import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({ 
    args: { id: v.id("daemons") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const all = query({
    handler: async (ctx) => {
        return await ctx.db.query("daemons").collect();
    },
});

export const updateTraits = mutation({
    args: {
        daemonId: v.id("daemons"),
        traitDeltas: v.array(v.object({
            trait: v.string(),
            delta: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        const daemon = await ctx.db.get(args.daemonId);
        if (!daemon) {
            throw new Error("Daemon not found");
        }

        const newTraits = { ...daemon.traits };
        for (const { trait, delta } of args.traitDeltas) {
            newTraits[trait as keyof typeof newTraits] = (newTraits[trait as keyof typeof newTraits] || 0) + delta;
        }

        await ctx.db.patch(daemon._id, { traits: newTraits });
    },
});

export const ensureSeed = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("daemons").collect();
        if (existing.length > 0) return existing.map(d => d._id);
        const zeroTraits = {
            Intelligence: 0, Creativity: 0, Empathy: 0, Resilience: 0, Curiosity: 0,
            Humor: 0, Kindness: 0, Confidence: 0, Discipline: 0, Honesty: 0,
            Patience: 0, Optimism: 0, Courage: 0, OpenMindedness: 0, Prudence: 0,
            Adaptability: 0, Gratitude: 0, Ambition: 0, Humility: 0, Playfulness: 0,
        };
        const now = Date.now();
        const ids = [] as string[];
        ids.push(await ctx.db.insert("daemons", { name: "Nova", stage: 0, traits: zeroTraits, feedsSinceEvolution: 0, satisfaction: 0, spriteUrl: "", lastUpdated: now }));
        ids.push(await ctx.db.insert("daemons", { name: "Pixel", stage: 0, traits: zeroTraits, feedsSinceEvolution: 0, satisfaction: 0, spriteUrl: "", lastUpdated: now }));
        ids.push(await ctx.db.insert("daemons", { name: "Echo", stage: 0, traits: zeroTraits, feedsSinceEvolution: 0, satisfaction: 0, spriteUrl: "", lastUpdated: now }));
        return ids;
    }
});