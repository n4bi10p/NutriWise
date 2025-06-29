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
    <div className="space-y-8 p-6">
      {/* Header Card */}
      <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/20 shadow-2xl rounded-3xl p-8 transform hover:scale-[1.01] transition-all duration-200">
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-purple-500/25">
            <ShoppingCart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Smart Grocery List Generator</h2>
            <p className="text-gray-600 dark:text-gray-300">Generate, save, and share shopping lists from your meal plans</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Meal Plan or Recipes
            </label>
            <div className="relative">
              <textarea
                value={mealPlanInput}
                onChange={(e) => setMealPlanInput(e.target.value)}
                placeholder="Paste your meal plan or list of recipes here..."
                className="w-full h-36 px-6 py-4 bg-white/40 dark:bg-white/10 border border-white/50 dark:border-white/20 rounded-2xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-all duration-200 shadow-lg backdrop-blur-lg"
              />
              <div className="absolute bottom-4 right-4 text-xs text-gray-500 dark:text-gray-400">
                {mealPlanInput.length} characters
              </div>
            </div>
          </div>

          <button
            onClick={generateGroceryList}
            disabled={loading || !mealPlanInput.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-2xl font-semibold hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] transform"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-3 animate-spin" />
                Generating List...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-3" />
                Generate Grocery List
              </>
            )}
          </button>
        </div>
      </div>

      {groceryItems.length > 0 && (
        <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/20 shadow-2xl rounded-3xl p-8 transform hover:scale-[1.005] transition-all duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
            <div className="flex-1">
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Enter list name..."
                className="text-2xl font-bold bg-transparent border-none text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none w-full mb-2"
              />
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 bg-white/20 dark:bg-white/10 px-3 py-1 rounded-full">
                  {groceryItems.filter(item => !item.checked).length} items remaining
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 bg-white/20 dark:bg-white/10 px-3 py-1 rounded-full">
                  {groceryItems.filter(item => item.checked).length} completed
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveList}
                disabled={saving}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center shadow-lg hover:shadow-green-500/25 hover:scale-105 transform disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              
              <button
                onClick={shareList}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center shadow-lg hover:shadow-blue-500/25 hover:scale-105 transform"
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </button>
              
              <button
                onClick={exportList}
                className="bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center shadow-lg hover:shadow-gray-500/25 hover:scale-105 transform"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              
              {groceryItems.some(item => item.checked) && (
                <button
                  onClick={clearChecked}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 shadow-lg hover:shadow-red-500/25 hover:scale-105 transform"
                >
                  Clear Checked
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="bg-white/20 dark:bg-white/5 backdrop-blur-lg border border-white/30 dark:border-white/15 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01]">
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mr-3">{category}</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-300 dark:from-gray-600 to-transparent"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 bg-white/20 dark:bg-white/10 px-3 py-1 rounded-full ml-3">
                    {items.length} items
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`group flex items-center p-4 bg-white/25 dark:bg-white/10 backdrop-blur-sm border border-white/40 dark:border-white/20 rounded-xl transition-all duration-150 hover:shadow-lg cursor-pointer ${
                        item.checked ? 'opacity-60 scale-95' : 'hover:scale-[1.02] hover:bg-white/35 dark:hover:bg-white/15'
                      }`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <button
                        className={`w-6 h-6 rounded-lg border-2 mr-4 flex items-center justify-center transition-all duration-150 flex-shrink-0 ${
                          item.checked
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 shadow-lg shadow-green-500/25'
                            : 'border-gray-400 dark:border-gray-500 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 group-hover:scale-110'
                        }`}
                      >
                        {item.checked && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <span
                        className={`flex-1 font-medium transition-all duration-150 ${
                          item.checked
                            ? 'line-through text-gray-500 dark:text-gray-400'
                            : 'text-gray-800 dark:text-white group-hover:text-gray-900 dark:group-hover:text-gray-100'
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