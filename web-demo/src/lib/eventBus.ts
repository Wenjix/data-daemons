import mitt from 'mitt'

type Events = {
  feed: { text?: string; imageUrl?: string }
  analyzeResult: {
    caption?: string
    tags: string[]
    roast?: string
    traitDeltas: { trait: string; delta: number }[]
  }
}

export const eventBus = mitt<Events>()