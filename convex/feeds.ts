import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper thresholds per stage code: 0=Egg, 1=Baby, 2=Teen, 3=Adult
const FEED_THRESHOLDS: Record<number, number> = { 0: 5, 1: 8, 2: 12, 3: 12 };

export const getByFeedId = query({
  args: { feedId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("feeds")
      .withIndex("by_feedId", (q) => q.eq("feedId", args.feedId))
      .first();
    return existing ?? null;
  },
});

export const startProcessing = mutation({
  args: {
    feedId: v.string(),
    daemonId: v.id("daemons"),
    source: v.union(v.literal("email"), v.literal("drag-drop")),
    contentSummary: v.string(),
    attachmentsMeta: v.any(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("feeds")
      .withIndex("by_feedId", (q) => q.eq("feedId", args.feedId))
      .first();
    if (existing) {
      // Enforce uniqueness: no-op if feedId already present
      return existing._id;
    }
    const id = await ctx.db.insert("feeds", {
      feedId: args.feedId,
      daemonId: args.daemonId,
      source: args.source,
      status: "processing",
      contentSummary: args.contentSummary,
      traitsDelta: {
        Intelligence: 0,
        Creativity: 0,
        Empathy: 0,
        Resilience: 0,
        Curiosity: 0,
        Humor: 0,
        Kindness: 0,
        Confidence: 0,
        Discipline: 0,
        Honesty: 0,
        Patience: 0,
        Optimism: 0,
        Courage: 0,
        OpenMindedness: 0,
        Prudence: 0,
        Adaptability: 0,
        Gratitude: 0,
        Ambition: 0,
        Humility: 0,
        Playfulness: 0,
      },
      roast: "",
      attachmentsMeta: args.attachmentsMeta,
      createdAt: args.now,
      startedAt: args.now,
      completedAt: undefined,
      errorMessage: undefined,
    });
    return id;
  },
});

export const complete = mutation({
  args: {
    feedId: v.string(),
    traitsDelta: v.object({
      Intelligence: v.number(),
      Creativity: v.number(),
      Empathy: v.number(),
      Resilience: v.number(),
      Curiosity: v.number(),
      Humor: v.number(),
      Kindness: v.number(),
      Confidence: v.number(),
      Discipline: v.number(),
      Honesty: v.number(),
      Patience: v.number(),
      Optimism: v.number(),
      Courage: v.number(),
      OpenMindedness: v.number(),
      Prudence: v.number(),
      Adaptability: v.number(),
      Gratitude: v.number(),
      Ambition: v.number(),
      Humility: v.number(),
      Playfulness: v.number(),
    }),
    roast: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const feed = await ctx.db
      .query("feeds")
      .withIndex("by_feedId", (q) => q.eq("feedId", args.feedId))
      .first();
    if (!feed) throw new Error("Feed not found");
    if (feed.status !== "processing") throw new Error("Invalid status transition");

    // Update feed record to completed
    await ctx.db.patch(feed._id, {
      status: "completed",
      traitsDelta: args.traitsDelta,
      roast: args.roast,
      completedAt: args.now,
      errorMessage: undefined,
    });

    // Apply trait deltas to daemon and perform evolution threshold logic
    const daemon = await ctx.db.get(feed.daemonId);
    if (!daemon) throw new Error("Daemon not found for feed");

    const newTraits = { ...daemon.traits };
    for (const key of Object.keys(args.traitsDelta)) {
      // @ts-ignore
      newTraits[key] = (newTraits[key] || 0) + (args.traitsDelta as any)[key];
    }

    let feedsSince = (daemon.feedsSinceEvolution || 0) + 1;
    let stage = daemon.stage || 0;
    let evolved = false;
    const threshold = FEED_THRESHOLDS[stage] ?? 12;
    if (feedsSince >= threshold && stage < 3) {
      stage += 1; // advance stage
      feedsSince = 0; // reset counter after evolution
      evolved = true;
    }

    await ctx.db.patch(feed.daemonId, {
      traits: newTraits,
      feedsSinceEvolution: feedsSince,
      stage,
      lastUpdated: args.now,
    });

    return { evolved, stage, feedsSinceEvolution: feedsSince };
  },
});

export const errored = mutation({
  args: {
    feedId: v.string(),
    errorMessage: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const feed = await ctx.db
      .query("feeds")
      .withIndex("by_feedId", (q) => q.eq("feedId", args.feedId))
      .first();
    if (!feed) throw new Error("Feed not found");
    if (feed.status !== "processing") throw new Error("Invalid status transition");
    await ctx.db.patch(feed._id, {
      status: "errored",
      errorMessage: args.errorMessage,
      completedAt: args.now,
    });
    return feed._id;
  },
});