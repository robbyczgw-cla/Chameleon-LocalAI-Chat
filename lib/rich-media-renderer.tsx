/**
 * Rich Media Renderer - Automatically detect and render rich media embeds
 * Supports: YouTube, Twitter/X, CodeSandbox, StackBlitz, Spotify, and more
 */

import { Card } from "@/components/ui/card"

export interface RichMediaProps {
  url: string
  className?: string
}

/**
 * Detect URL type and render appropriate embed
 */
export function detectAndRenderMedia(url: string): JSX.Element | null {
  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return <YouTubeEmbed url={url} />
  }

  // Twitter/X
  if (url.includes("twitter.com") || url.includes("x.com")) {
    return <TwitterEmbed url={url} />
  }

  // CodeSandbox
  if (url.includes("codesandbox.io")) {
    return <CodeSandboxEmbed url={url} />
  }

  // StackBlitz
  if (url.includes("stackblitz.com")) {
    return <StackBlitzEmbed url={url} />
  }

  // Spotify
  if (url.includes("spotify.com")) {
    return <SpotifyEmbed url={url} />
  }

  // GitHub Gist
  if (url.includes("gist.github.com")) {
    return <GitHubGistEmbed url={url} />
  }

  // Figma
  if (url.includes("figma.com")) {
    return <FigmaEmbed url={url} />
  }

  return null
}

/**
 * Extract YouTube video ID from various URL formats
 */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

export function YouTubeEmbed({ url, className = "" }: RichMediaProps) {
  const videoId = getYouTubeId(url)

  if (!videoId) {
    return <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{url}</a>
  }

  return (
    <Card className={`overflow-hidden my-4 ${className}`}>
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </Card>
  )
}

export function TwitterEmbed({ url, className = "" }: RichMediaProps) {
  // Extract tweet ID
  const match = url.match(/status\/(\d+)/)
  const tweetId = match ? match[1] : null

  if (!tweetId) {
    return <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{url}</a>
  }

  return (
    <Card className={`p-4 my-4 ${className}`}>
      <div className="text-sm text-muted-foreground mb-2">Twitter/X Post:</div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline font-medium"
      >
        View Tweet →
      </a>
      <div className="text-xs text-muted-foreground mt-2">
        (Twitter embeds require external script - click to view)
      </div>
    </Card>
  )
}

export function CodeSandboxEmbed({ url, className = "" }: RichMediaProps) {
  // Convert URL to embed URL
  const embedUrl = url.replace("/s/", "/embed/")

  return (
    <Card className={`overflow-hidden my-4 ${className}`}>
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title="CodeSandbox"
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      </div>
    </Card>
  )
}

export function StackBlitzEmbed({ url, className = "" }: RichMediaProps) {
  // Convert URL to embed URL if needed
  const embedUrl = url.includes("/embed/") ? url : url.replace("stackblitz.com/", "stackblitz.com/embed/")

  return (
    <Card className={`overflow-hidden my-4 ${className}`}>
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title="StackBlitz"
        />
      </div>
    </Card>
  )
}

export function SpotifyEmbed({ url, className = "" }: RichMediaProps) {
  // Convert URL to embed URL
  const embedUrl = url.replace("spotify.com/", "spotify.com/embed/")

  return (
    <Card className={`overflow-hidden my-4 ${className}`}>
      <iframe
        className="w-full"
        src={embedUrl}
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </Card>
  )
}

export function GitHubGistEmbed({ url, className = "" }: RichMediaProps) {
  return (
    <Card className={`p-4 my-4 ${className}`}>
      <div className="text-sm text-muted-foreground mb-2">GitHub Gist:</div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline font-medium"
      >
        View Gist →
      </a>
      <div className="text-xs text-muted-foreground mt-2">
        (GitHub Gists require external script - click to view)
      </div>
    </Card>
  )
}

export function FigmaEmbed({ url, className = "" }: RichMediaProps) {
  // Extract file ID from Figma URL
  const match = url.match(/file\/([^\/]+)/)
  const fileId = match ? match[1] : null

  if (!fileId) {
    return <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{url}</a>
  }

  const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`

  return (
    <Card className={`overflow-hidden my-4 ${className}`}>
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title="Figma"
          allowFullScreen
        />
      </div>
    </Card>
  )
}

/**
 * Process text content and replace URLs with embeds
 */
export function processRichMedia(content: string): string {
  // This function can be used to pre-process content
  // For now, we'll rely on the markdown link renderer
  return content
}

/**
 * Check if a URL should be rendered as rich media
 */
export function isRichMediaUrl(url: string): boolean {
  const richMediaDomains = [
    "youtube.com",
    "youtu.be",
    "twitter.com",
    "x.com",
    "codesandbox.io",
    "stackblitz.com",
    "spotify.com",
    "gist.github.com",
    "figma.com",
  ]

  return richMediaDomains.some((domain) => url.includes(domain))
}
