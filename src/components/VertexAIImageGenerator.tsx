import { useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface VertexAIImageGeneratorProps {
  dishName: string;
  description?: string;
  cuisineType?: string;
  plating?: string;
  className?: string;
  onImageGenerated?: (imageUrl: string) => void;
  onError?: (error: string) => void;
}

export function VertexAIImageGenerator({
  dishName,
  description,
  cuisineType = 'modern',
  plating = 'elegant',
  className = '',
  onImageGenerated,
  onError
}: VertexAIImageGeneratorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // For Netlify deployment, use the function directly
  // For local development, you can still use the separate server if needed
  const VERTEX_AI_API_URL = import.meta.env.VITE_VERTEX_AI_API_URL || '';
  
  // Determine the API endpoint
  const getApiEndpoint = () => {
    if (VERTEX_AI_API_URL) {
      // Use external server if URL is provided
      return `${VERTEX_AI_API_URL}/api/generate-food-image`;
    } else {
      // Use Netlify function (default for production)
      return '/api/generate-food-image';
    }
  };

  // Auto-generate image when component mounts
  useEffect(() => {
    if (dishName && !hasGenerated) {
      generateImage();
    }
  }, [dishName]);

  const generateImage = async () => {
    if (!dishName.trim()) {
      const errorMsg = 'Dish name is required for image generation';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🎨 Generating AI image for: ${dishName}`);

      const response = await fetch(getApiEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dishName: dishName.trim(),
          description: description?.trim(),
          cuisineType: cuisineType,
          plating: plating
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.imageUrl) {
        console.log('✅ AI image generated successfully');
        setImageUrl(result.imageUrl);
        setHasGenerated(true);
        onImageGenerated?.(result.imageUrl);
      } else {
        throw new Error(result.error || 'Failed to generate image');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ AI image generation failed:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setHasGenerated(false);
    setImageUrl(null);
    generateImage();
  };

  return (
    <div className={`relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              AI Generated Image
            </span>
          </div>
          
          {(imageUrl || error) && (
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-purple-500/20 hover:bg-purple-500/30 
                       disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              title="Regenerate image"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="aspect-square relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <Camera className="w-8 h-8 text-purple-500" />
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Generating AI Image...
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Creating {dishName}
                </p>
              </div>
              <div className="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20">
            <div className="flex flex-col items-center space-y-3 p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Image Generation Failed
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
              <button
                onClick={generateImage}
                className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {imageUrl && !loading && (
          <div className="absolute inset-0">
            <img
              src={imageUrl}
              alt={`AI generated image of ${dishName}`}
              className="w-full h-full object-cover"
              onError={() => {
                setError('Failed to load generated image');
                setImageUrl(null);
              }}
            />
            
            {/* Overlay with dish name */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-sm font-medium truncate">
                {dishName}
              </p>
              {description && (
                <p className="text-white/80 text-xs truncate mt-1">
                  {description}
                </p>
              )}
            </div>
            
            {/* AI Badge */}
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                             bg-purple-500/90 text-white backdrop-blur-sm">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </span>
            </div>
          </div>
        )}

        {!imageUrl && !loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
            <div className="flex flex-col items-center space-y-3">
              <Camera className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Ready to Generate
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Click to create AI image
                </p>
              </div>
              <button
                onClick={generateImage}
                className="px-3 py-1 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Generate Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VertexAIImageGenerator;
