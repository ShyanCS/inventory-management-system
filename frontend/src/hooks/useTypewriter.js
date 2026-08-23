import { useState, useEffect } from 'react'

export function useTypewriter(text, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const [prevText, setPrevText] = useState(text)

  // Reset animation when the target text changes (adjust state during render)
  if (text !== prevText) {
    setPrevText(text)
    setDisplayed('')
    setDone(false)
  }

  useEffect(() => {
    let timeoutId
    let intervalId

    timeoutId = setTimeout(() => {
      let currentIndex = 0
      intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          const char = text[currentIndex]
          setDisplayed((prev) => prev + (char !== undefined ? char : ''))
          currentIndex++
        }
        if (currentIndex >= text.length) {
          clearInterval(intervalId)
          setDone(true)
        }
      }, speed)
    }, startDelay)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [text, speed, startDelay])

  return { displayed, done }
}
