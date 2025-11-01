import { useEffect, useState } from 'react'

interface SpeechBubbleProps {
  message: string
  onDismiss?: () => void
  displayDuration?: number // milliseconds
}

export function SpeechBubble({ message, onDismiss, displayDuration = 6000 }: SpeechBubbleProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    // Start fade-out animation 500ms before dismissing
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true)
    }, displayDuration - 500)

    // Dismiss after full duration
    const dismissTimer = setTimeout(() => {
      setIsVisible(false)
      onDismiss?.()
    }, displayDuration)

    return () => {
      clearTimeout(fadeOutTimer)
      clearTimeout(dismissTimer)
    }
  }, [displayDuration, onDismiss])

  if (!isVisible) {
    return null
  }

  return (
    <div className={`speech-bubble ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="speech-bubble-content">
        {message}
      </div>
      <div className="speech-bubble-arrow" />
    </div>
  )
}
