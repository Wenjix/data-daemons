import { useEffect, useState } from 'react'

interface SummonerBubbleProps {
  onSummon?: () => void
}

export function SummonerBubble({ onSummon }: SummonerBubbleProps) {
  const message = "Shall I summon a daily report web app for you?"
  const [displayedText, setDisplayedText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // Reset and start streaming animation
    setDisplayedText('')
    setIsStreaming(true)
    setShowButton(false)

    let currentIndex = 0
    const streamingSpeed = 45 // milliseconds per character

    const interval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayedText(message.substring(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsStreaming(false)
        setShowButton(true)
        clearInterval(interval)
      }
    }, streamingSpeed)

    // Cleanup function
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div className={`summoner-bubble ${isStreaming ? 'streaming' : ''}`}>
      <div className="summoner-bubble-content">
        <p className="summoner-text">
          {displayedText}
          {isStreaming && <span className="cursor">▊</span>}
        </p>
        {showButton && (
          <button className="summon-btn" onClick={onSummon}>
            Summon Now ✨
          </button>
        )}
      </div>
      <div className="summoner-bubble-arrow-left" />
    </div>
  )
}
