interface BunnyPlayerProps {
  videoId?: string;
  libraryId?: string;
  title?: string;
  className?: string;
}

export default function BunnyPlayer({ videoId, libraryId = 'YOUR_LIBRARY_ID', title, className = '' }: BunnyPlayerProps) {
  if (!videoId) {
    return (
      <div className={`relative aspect-video bg-navy-mid flex flex-col items-center justify-center rounded-xl overflow-hidden ${className}`}>
        <div className="text-6xl mb-4">🎬</div>
        <p className="text-muted-foreground text-sm">Video will appear here</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Connect Bunny.net Stream to play videos</p>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video rounded-xl overflow-hidden ${className}`}>
      <iframe
        src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`}
        title={title || 'Course Video'}
        loading="lazy"
        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  );
}
