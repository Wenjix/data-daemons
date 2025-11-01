import { useEffect, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { usePetStore } from '../stores/petStore'
import { getRandomMusing, getTopTrait, type TraitKey } from '../data/idleMusings'
import type { Id } from '../../../convex/_generated/dataModel'

const MIN_IDLE_INTERVAL = 15000 // 15 seconds
const MAX_IDLE_INTERVAL = 30000 // 30 seconds
const IDLE_THRESHOLD = 15000 // 15 seconds of no feed activity
const STAGGER_OFFSET = 5000 // 5 seconds stagger between daemons

/**
 * Hook that manages idle musings for a specific daemon
 * Triggers personality-driven speech bubbles every 15-30 seconds when idle
 * @param daemonId - The ID of the daemon to manage musings for
 * @param index - The index of the daemon (0-2) for staggering timing
 */
export function useIdleMusingsForDaemon(daemonId: Id<'daemons'>, index: number) {
  const lastFeedTimes = usePetStore((s) => s.lastFeedTimes)
  const setIdleMusing = usePetStore((s) => s.setIdleMusing)
  const clearIdleMusing = usePetStore((s) => s.clearIdleMusing)

  const daemon = useQuery(
    api.daemons.get,
    daemonId ? { id: daemonId } : 'skip'
  )

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // Don't start musings if no daemon data
    if (!daemon || !daemonId) {
      return
    }

    const scheduleNextMusing = () => {
      // Random interval between 15-30 seconds, plus stagger offset
      const daemonOffset = index * STAGGER_OFFSET
      const interval = MIN_IDLE_INTERVAL + daemonOffset + Math.random() * (MAX_IDLE_INTERVAL - MIN_IDLE_INTERVAL)

      timerRef.current = setTimeout(() => {
        const now = Date.now()
        const lastFeedTime = lastFeedTimes[daemonId]
        const timeSinceLastFeed = lastFeedTime ? now - lastFeedTime : Infinity

        // Only show musing if daemon has been idle long enough
        if (timeSinceLastFeed >= IDLE_THRESHOLD) {
          // Get daemon's top trait
          const traits = daemon.traits
          const topTrait = getTopTrait(traits)

          if (topTrait) {
            // Get random musing for that trait
            const message = getRandomMusing(topTrait as TraitKey)

            // Set the musing in store for this specific daemon
            setIdleMusing(daemonId, {
              message,
              trait: topTrait,
              timestamp: now,
            })

            // Auto-clear after display duration (handled by SpeechBubble component)
            // But also clear from store after 7 seconds to ensure cleanup
            setTimeout(() => clearIdleMusing(daemonId), 7000)
          }
        }

        // Schedule next musing
        scheduleNextMusing()
      }, interval)
    }

    // Start the cycle
    scheduleNextMusing()

    // Cleanup on unmount or daemon change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [daemon, daemonId, lastFeedTimes, setIdleMusing, clearIdleMusing, index])

  // Clear musing when this specific daemon is fed
  useEffect(() => {
    const lastFeedTime = lastFeedTimes[daemonId]
    if (lastFeedTime) {
      clearIdleMusing(daemonId)
    }
  }, [lastFeedTimes, daemonId, clearIdleMusing])
}
