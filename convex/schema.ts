import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const traits = v.object({
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
});

export default defineSchema({
    daemons: defineTable({
        name: v.string(),
        stage: v.number(),
        traits: traits,
        feedsSinceEvolution: v.number(),
        satisfaction: v.number(),
        spriteUrl: v.string(),
        lastUpdated: v.number(),
    }),
    feeds: defineTable({
        feedId: v.string(),
        daemonId: v.id("daemons"),
        source: v.union(v.literal("email"), v.literal("drag-drop")),
        status: v.union(v.literal("processing"), v.literal("completed"), v.literal("errored")),
        contentSummary: v.string(),
        traitsDelta: traits,
        roast: v.string(),
        attachmentsMeta: v.any(),
        errorMessage: v.optional(v.string()),
        createdAt: v.number(),
        startedAt: v.number(),
        completedAt: v.optional(v.number()),
    }).index("by_feedId", ["feedId"]),
    managerLogs: defineTable({
        brainstormIdea: v.string(),
        contributions: v.array(v.object({
            daemonName: v.string(),
            role: v.string(),
            highlight: v.string(),
        })),
        createdAt: v.number(),
    }),
});