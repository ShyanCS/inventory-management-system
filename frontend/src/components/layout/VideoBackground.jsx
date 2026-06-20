import { useEffect, useRef } from 'react'

export default function VideoBackground() {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let prevX = window.innerWidth / 2 // Start in the middle
    let isSeeking = false
    let targetTime = 0
    const SENSITIVITY = 0.8

    const handleMouseMove = (e) => {
      const currentX = e.clientX
      const delta = currentX - prevX
      prevX = currentX

      if (!video.duration) return

      const timeDelta = (delta / window.innerWidth) * SENSITIVITY * video.duration
      targetTime = Math.max(0, Math.min(video.duration, targetTime + timeDelta))

      if (!isSeeking) {
        isSeeking = true
        video.currentTime = targetTime
      }
    }

    const handleSeeked = () => {
      if (Math.abs(video.currentTime - targetTime) > 0.05) {
        // Still need to seek closer to target
        video.currentTime = targetTime
      } else {
        isSeeking = false
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    video.addEventListener('seeked', handleSeeked)

    // Ensure metadata is loaded to get duration
    const handleLoadedMetadata = () => {
      // Start somewhere in the middle if desired, or at 0
      targetTime = video.duration / 2
      video.currentTime = targetTime
    }
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4"
      muted
      playsInline
      preload="auto"
      className="fixed inset-0 z-0 object-cover w-full h-full"
      style={{ objectPosition: '70% center' }}
    />
  )
}
