import { useEffect, useState } from 'react'

interface AgentifyBubbleProps {
  message: string
  daemonName: string // 'nova', 'pixel', or 'echo'
}

export function AgentifyBubble({ message, daemonName }: AgentifyBubbleProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    // Reset and start streaming animation
    setDisplayedText('')
    setIsStreaming(true)

    let currentIndex = 0
    const streamingSpeed = 45 // milliseconds per character

    const interval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayedText(message.substring(0, currentIndex + 1))
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
  }, [message])

  return (
    <div className={`agentify-bubble daemon-${daemonName.toLowerCase()} ${isStreaming ? 'streaming' : ''}`}>
      <div className="agentify-bubble-content">
        {displayedText}
        {isStreaming && <span className="cursor">▊</span>}
      </div>
      <div className="agentify-bubble-arrow" />
    </div>
  )
}
