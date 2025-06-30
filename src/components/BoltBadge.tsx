interface BoltBadgeProps {
  variant?: 'white' | 'black' | 'text'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function BoltBadge({ 
  variant = 'white', 
  size = 'medium', 
  className = '' 
}: BoltBadgeProps) {
  const sizeClasses = {
    small: 'h-6',
    medium: 'h-8', 
    large: 'h-12'
  }

  const getImageSrc = () => {
    switch (variant) {
      case 'black':
        return '/black_circle_360x360.png'
      case 'text':
        return '/logotext_poweredby_360w.png'
      case 'white':
      default:
        return '/white_circle_360x360.png'
    }
  }

  return (
    <a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block transition-opacity hover:opacity-80 ${className}`}
      title="Built with Bolt.new"
    >
      <img
        src={getImageSrc()}
        alt="Built with Bolt.new"
        className={`${sizeClasses[size]} w-auto`}
      />
    </a>
  )
}
