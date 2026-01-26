'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { Tag, Plus, X } from 'lucide-react'
import type { ContactTag } from '@/lib/types'

interface TagManagerProps {
  tags: ContactTag[]
  onUpdate: () => void
}

const colorOptions = [
  '#6B7280', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316',
]

export function TagManager({ tags, onUpdate }: TagManagerProps) {
  const [open, setOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6B7280')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' })
      setLoading(false)
      return
    }

    const { error } = await supabase.from('contact_tags').insert([{
      name: newTagName.trim(),
      color: newTagColor,
      user_id: user.id,
    }])

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Tag created', description: `Tag "${newTagName}" has been created.` })
      setNewTagName('')
      onUpdate()
    }
    setLoading(false)
  }

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Delete tag "${tagName}"? This will remove it from all contacts.`)) return

    const { error } = await supabase.from('contact_tags').delete().eq('id', tagId)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Tag deleted', description: `Tag "${tagName}" has been removed.` })
      onUpdate()
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="h-4 w-4 mr-2" />
          Manage Tags
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-2">
          <p className="text-sm font-medium mb-2">Tags</p>
          
          {/* Existing Tags */}
          <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
            {tags.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">No tags yet</p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm">{tag.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTag(tag.id, tag.name)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          <DropdownMenuSeparator />

          {/* Create New Tag */}
          <div className="pt-2">
            <p className="text-xs font-medium text-gray-500 mb-2">Create new tag</p>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-center space-x-1 mb-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`w-5 h-5 rounded-full ${
                    newTagColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || loading}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Tag
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
