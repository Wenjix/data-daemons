import { useEffect, useState } from 'react'

interface RoastDisplayProps {
  roast?: string
  fallbackMessage?: string
}

export function RoastDisplay({ roast, fallbackMessage = 'Feed the pet to get a roast...' }: RoastDisplayProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    // If no roast, show fallback immediately
    if (!roast) {
      setDisplayedText(fallbackMessage)
      setIsStreaming(false)
      return
    }

    // Reset and start streaming animation
    setDisplayedText('')
    setIsStreaming(true)

    let currentIndex = 0
    const streamingSpeed = 45 // milliseconds per character (medium pace)

    const interval = setInterval(() => {
      if (currentIndex < roast.length) {
        setDisplayedText(roast.substring(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsStreaming(false)
        clearInterval(interval)
      }
    }, streamingSpeed)

    // Cleanup function
    return () => {
      clearInterval(interval)
    }
  }, [roast, fallbackMessage])

  return (
    <div className={`roast-display ${isStreaming ? 'streaming' : ''}`}>
      <p className="roast-text">
        {displayedText}
        {isStreaming && <span className="cursor">▊</span>}
      </p>
      <div className="roast-bubble-arrow" />
    </div>
  )
}
