import React, { useState } from 'react'
import { AlertTriangle, X, Database } from 'lucide-react'
import DatabaseSetup from './DatabaseSetup'

interface DatabaseWarningProps {
  onDismiss: () => void
}

const DatabaseWarning: React.FC<DatabaseWarningProps> = ({ onDismiss }) => {
  const [showSetup, setShowSetup] = useState(false)

  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">Database Setup Incomplete</h3>
            <p className="text-sm text-amber-700 mt-1">
              Some features may not work properly. Please run the database migration script to enable full functionality.
            </p>
            <button
              onClick={() => setShowSetup(true)}
              className="mt-2 inline-flex items-center space-x-1 bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700 transition-colors"
            >
              <Database className="h-4 w-4" />
              <span>Show Setup Instructions</span>
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-amber-500 hover:text-amber-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {showSetup && (
        <DatabaseSetup onClose={() => setShowSetup(false)} />
      )}
    </>
  )
}

export default DatabaseWarning
