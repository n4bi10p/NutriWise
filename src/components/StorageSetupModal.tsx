import { X, Database, Copy } from 'lucide-react'

interface StorageSetupModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StorageSetupModal({ isOpen, onClose }: StorageSetupModalProps) {
  if (!isOpen) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const sqlCommand = `-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for profile photos
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Profile photos are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');`

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Storage Setup Required</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Configure Supabase storage for profile photos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Setup Required:</h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p><strong>Step 1:</strong> Add database column (run SQL below in Supabase SQL Editor)</p>
              <p><strong>Step 2:</strong> Create storage bucket (Option 1-3 below)</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Step 1: Add Database Column</h3>
              <button
                onClick={() => copyToClipboard('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;')}
                className="flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </button>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto mb-4">
              <code>ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;</code>
            </pre>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Step 2: Storage Bucket Setup Options:</h4>
            <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
              <p><strong>Option 1:</strong> Go to your Supabase dashboard → Storage → Create a new bucket named "profile-photos" and make it public</p>
              <p><strong>Option 2:</strong> Create an "avatars" bucket (common default name)</p>
              <p><strong>Option 3:</strong> Run the SQL command below in your Supabase SQL Editor</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Step 3: Create Storage Bucket (SQL Option)</h3>
              <button
                onClick={() => copyToClipboard(sqlCommand)}
                className="flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </button>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto">
              <code>{sqlCommand}</code>
            </pre>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Manual Dashboard Setup (Alternative to SQL):</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-green-800 dark:text-green-200">
              <li>Go to your Supabase project dashboard</li>
              <li>Navigate to "Table Editor" → Select "profiles" table → Add Column: "profile_photo_url" (type: text)</li>
              <li>Navigate to Storage in the left sidebar</li>
              <li>Click "Create bucket"</li>
              <li>Name it "profile-photos" or "avatars"</li>
              <li>Make sure "Public bucket" is enabled</li>
              <li>Set file size limit to 5MB</li>
              <li>Click "Save"</li>
            </ol>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium"
          >
            Got it, I'll set this up
          </button>
        </div>
      </div>
    </div>
  )
}
