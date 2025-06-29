import { useState, useEffect } from 'react'
import { Profile, saveGroceryList, getActiveGroceryList, updateGroceryList } from '../lib/supabase'
import { chatWithGemini } from '../lib/gemini'
import { ShoppingCart, Loader, Check, Save, Share, Download } from 'lucide-react'

interface GroceryListProps {
  profile: Profile
}

interface GroceryItem {
  id: string
  name: string
  checked: boolean
  category?: string
}

export function GroceryList({ profile }: GroceryListProps) {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mealPlanInput, setMealPlanInput] = useState('')
  const [listName, setListName] = useState('')
  const [currentListId, setCurrentListId] = useState<string | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Load active grocery list on component mount
  useEffect(() => {
    loadActiveGroceryList()
  }, [profile.user_id])

  // Auto-save when grocery items change (after initial load)
  useEffect(() => {
    if (initialLoadComplete && groceryItems.length > 0) {
      autoSaveGroceryList()
    }
  }, [groceryItems, initialLoadComplete])

  const loadActiveGroceryList = async () => {
    try {
      const activeList = await getActiveGroceryList(profile.user_id)
      if (activeList) {
        setGroceryItems(activeList.items || [])
        setListName(activeList.name)
        setCurrentListId(activeList.id)
      }
    } catch (error) {
      console.error('Error loading active grocery list:', error)
    } finally {
      setInitialLoadComplete(true)
    }
  }

  const autoSaveGroceryList = async () => {
    if (!currentListId || groceryItems.length === 0) return

    try {
      await updateGroceryList(currentListId, {
        items: groceryItems,
        name: listName
      })
    } catch (error) {
      console.error('Error auto-saving grocery list:', error)
    }
  }

  const generateGroceryList = async () => {
    if (!mealPlanInput.trim()) return

    setLoading(true)
    try {
      const prompt = `Based on this meal plan, generate a comprehensive grocery shopping list organized by categories (Produce, Proteins, Dairy, Pantry, etc.):

${mealPlanInput}

Consider the user's dietary preferences: ${profile.dietary_restrictions?.join(', ') || 'None'}
Allergies to avoid: ${profile.allergies?.join(', ') || 'None'}

Format as a simple list with categories and items underneath. Include estimated quantities where helpful.`

      const response = await chatWithGemini(prompt, profile)
      
      // Parse the response into grocery items with categories
      const lines = response.split('\n').filter(line => line.trim())
      const items: GroceryItem[] = []
      let currentCategory = ''

      lines.forEach(line => {
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith('**') || trimmedLine.startsWith('#')) {
          // This is a category header
          currentCategory = trimmedLine.replace(/[*#]/g, '').trim()
        } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
          // This is an item
          const itemName = trimmedLine.replace(/^[-•]\s*/, '').trim()
          if (itemName) {
            items.push({
              id: Math.random().toString(36).substr(2, 9),
              name: itemName,
              checked: false,
              category: currentCategory
            })
          }
        }
      })

      const newListName = `Grocery List - ${new Date().toLocaleDateString()}`
      
      setGroceryItems(items)
      setListName(newListName)

      // Auto-save the new grocery list
      try {
        const savedList = await saveGroceryList(profile.user_id, {
          name: newListName,
          items: items,
          is_template: false,
          is_shared: false
        })
        setCurrentListId(savedList.id)
      } catch (saveError) {
        console.error('Error auto-saving grocery list:', saveError)
        // Continue even if save fails - user can manually save later
      }
    } catch (error) {
      console.error('Error generating grocery list:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (id: string) => {
    setGroceryItems(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const clearChecked = () => {
    setGroceryItems(items => items.filter(item => !item.checked))
  }

  const saveList = async () => {
    if (!listName.trim() || groceryItems.length === 0) return

    setSaving(true)
    try {
      if (currentListId) {
        // Update existing list
        await updateGroceryList(currentListId, {
          name: listName,
          items: groceryItems
        })
      } else {
        // Create new list
        const savedList = await saveGroceryList(profile.user_id, {
          name: listName,
          items: groceryItems,
          is_template: false,
          is_shared: false
        })
        setCurrentListId(savedList.id)
      }
      
      // Show success message (you could add a toast notification here)
      console.log('Grocery list saved successfully!')
    } catch (error) {
      console.error('Error saving grocery list:', error)
      console.warn('Failed to save grocery list. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const exportList = () => {
    const listText = groceryItems
      .filter(item => !item.checked)
      .map(item => `${item.category ? `[${item.category}] ` : ''}${item.name}`)
      .join('\n')
    
    const blob = new Blob([listText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${listName || 'grocery-list'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const shareList = async () => {
    const listText = groceryItems
      .filter(item => !item.checked)
      .map(item => `${item.category ? `[${item.category}] ` : ''}${item.name}`)
      .join('\n')
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listName || 'Grocery List',
          text: listText
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(listText).then(() => {
        alert('Grocery list copied to clipboard!')
      })
    }
  }

  // Group items by category
  const groupedItems = groceryItems.reduce((groups, item) => {
    const category = item.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {} as Record<string, GroceryItem[]>)

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Smart Grocery List Generator</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Generate, save, and share shopping lists from your meal plans</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meal Plan or Recipes
            </label>
            <textarea
              value={mealPlanInput}
              onChange={(e) => setMealPlanInput(e.target.value)}
              placeholder="Paste your meal plan or list of recipes here..."
              className="w-full h-32 px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white placeholder-gray-500 resize-none"
            />
          </div>

          <button
            onClick={generateGroceryList}
            disabled={loading || !mealPlanInput.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Generating List...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Generate Grocery List
              </>
            )}
          </button>
        </div>
      </div>

      {groceryItems.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Enter list name..."
                className="text-lg font-semibold bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
              />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {groceryItems.filter(item => !item.checked).length} items remaining
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={saveList}
                disabled={saving}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              
              <button
                onClick={shareList}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <Share className="w-4 h-4 mr-1" />
                Share
              </button>
              
              <button
                onClick={exportList}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
              
              {groceryItems.some(item => item.checked) && (
                <button
                  onClick={clearChecked}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Clear Checked
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{category}</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl transition-all duration-200 ${
                        item.checked ? 'opacity-50' : ''
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors duration-200 ${
                          item.checked
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                        }`}
                      >
                        {item.checked && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span
                        className={`flex-1 ${
                          item.checked
                            ? 'line-through text-gray-500 dark:text-gray-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}