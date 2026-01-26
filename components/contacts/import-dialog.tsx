'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Upload, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import type { ContactGroup } from '@/lib/types'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  groups?: ContactGroup[]
}

type ImportResult = {
  success: number
  failed: number
  errors: string[]
}

export function ImportDialog({ open, onClose, onSuccess, groups = [] }: ImportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (!open) {
      setSelectedGroupId('')
      setNewGroupName('')
      setShowNewGroup(false)
    }
  }, [open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast({ title: 'Error', description: 'Please select a CSV file', variant: 'destructive' })
      return
    }

    setFile(selectedFile)
    setResult(null)

    // Parse CSV for preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const parsed = lines.slice(0, 6).map(line => parseCSVLine(line))
      setPreview(parsed)
    }
    reader.readAsText(selectedFile)
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' })
      setLoading(false)
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        toast({ title: 'Error', description: 'CSV file must have headers and at least one data row', variant: 'destructive' })
        setLoading(false)
        return
      }

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
      
      // Support various column name formats
      const firstNameIndex = headers.findIndex(h => h === 'first name' || h === 'firstname')
      const lastNameIndex = headers.findIndex(h => h === 'last name' || h === 'lastname')
      const fullNameIndex = headers.findIndex(h => h === 'name' || h === 'full name' || h === 'fullname')
      const emailIndex = headers.findIndex(h => h.includes('email'))
      const phoneIndex = headers.findIndex(h => h.includes('phone'))
      const companyIndex = headers.findIndex(h => h.includes('company'))
      const messageIndex = headers.findIndex(h => h === 'message' || h === 'notes' || h === 'note')
      const statusIndex = headers.findIndex(h => h === 'status')
      const sourceIndex = headers.findIndex(h => h === 'source' || h === 'mortgage type' || h === 'type')

      const hasName = fullNameIndex >= 0 || firstNameIndex >= 0
      if (!hasName || emailIndex === -1) {
        toast({ title: 'Error', description: 'CSV must have name (or "First Name") and "email" columns', variant: 'destructive' })
        setLoading(false)
        return
      }

      const contacts: any[] = []
      const errors: string[] = []

      const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost']

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        
        // Build name from first + last or use full name
        let name = ''
        if (firstNameIndex >= 0) {
          const firstName = values[firstNameIndex]?.trim() || ''
          const lastName = lastNameIndex >= 0 ? values[lastNameIndex]?.trim() || '' : ''
          name = `${firstName} ${lastName}`.trim()
        } else if (fullNameIndex >= 0) {
          name = values[fullNameIndex]?.trim() || ''
        }

        const email = values[emailIndex]?.trim()

        if (!name || !email) {
          errors.push(`Row ${i + 1}: Missing name or email`)
          continue
        }

        // Get status, defaulting to 'new' if invalid
        let status = statusIndex >= 0 ? values[statusIndex]?.trim().toLowerCase() : 'new'
        if (!validStatuses.includes(status)) {
          status = 'new'
        }

        // Get notes from message field
        const notes = messageIndex >= 0 ? values[messageIndex]?.trim() || null : null

        // Get source/type
        const source = sourceIndex >= 0 ? values[sourceIndex]?.trim() || 'import' : 'import'

        contacts.push({
          name,
          email,
          phone: phoneIndex >= 0 ? values[phoneIndex]?.trim() || null : null,
          company: companyIndex >= 0 ? values[companyIndex]?.trim() || null : null,
          notes,
          source,
          status,
          user_id: user.id,
        })
      }

      if (contacts.length === 0) {
        toast({ title: 'Error', description: 'No valid contacts found in CSV', variant: 'destructive' })
        setLoading(false)
        return
      }

      // Determine the group to add contacts to
      let targetGroupId = (selectedGroupId && selectedGroupId !== '__none__') ? selectedGroupId : null

      // Create new group if specified
      if (showNewGroup && newGroupName.trim()) {
        const { data: newGroup, error: groupError } = await supabase
          .from('contact_groups')
          .insert([{ name: newGroupName.trim(), user_id: user.id }])
          .select()
          .single()

        if (groupError) {
          toast({ title: 'Error', description: `Failed to create group: ${groupError.message}`, variant: 'destructive' })
          setLoading(false)
          return
        }
        targetGroupId = newGroup.id
      }

      // Insert contacts and get their IDs
      const { data: insertedContacts, error } = await supabase
        .from('contacts')
        .insert(contacts)
        .select('id')

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      } else {
        // Add contacts to group if a group was selected
        if (targetGroupId && insertedContacts && insertedContacts.length > 0) {
          const groupMembers = insertedContacts.map(contact => ({
            contact_id: contact.id,
            group_id: targetGroupId,
          }))

          const { error: memberError } = await supabase
            .from('contact_group_members')
            .insert(groupMembers)

          if (memberError) {
            // Group member assignment failed silently
          }
        }

        const groupInfo = targetGroupId 
          ? ` and added to group` 
          : ''

        setResult({
          success: contacts.length,
          failed: errors.length,
          errors,
        })
        toast({ 
          title: 'Import complete', 
          description: `${contacts.length} contacts imported${groupInfo}` 
        })
      }

      setLoading(false)
    }

    reader.readAsText(file)
  }

  const handleClose = () => {
    setFile(null)
    setPreview([])
    setResult(null)
    onClose()
  }

  const handleDone = () => {
    handleClose()
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your contacts. Required columns: name, email
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="py-4 overflow-y-auto flex-1">
              {/* File Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-400 mt-1">CSV files only</p>
                  </>
                )}
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows):</p>
                  <div className="overflow-x-auto overflow-y-auto max-h-48 border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {preview[0]?.map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left font-medium text-gray-600">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(1).map((row, i) => (
                          <tr key={i} className="border-t">
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-gray-900 truncate max-w-[150px]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sample Format */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-1">Supported CSV formats:</p>
                <code className="text-xs text-gray-500 block">name,email,phone,company</code>
                <code className="text-xs text-gray-500 block mt-1">First Name,Last Name,email,Phone Number,message,status</code>
              </div>

              {/* Group Selection */}
              {file && (
                <div className="mt-4 p-4 border rounded-lg bg-white">
                  <Label className="text-sm font-medium">Add to Group (optional)</Label>
                  <p className="text-xs text-gray-500 mb-3">Choose a group or create a new one for these contacts</p>
                  
                  {!showNewGroup ? (
                    <div className="flex space-x-2">
                      <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Main list (no group)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Main list (no group)</SelectItem>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              <div className="flex items-center">
                                <div
                                  className="w-2 h-2 rounded-full mr-2"
                                  style={{ backgroundColor: group.color }}
                                />
                                {group.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowNewGroup(true)}
                        title="Create new group"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Input
                        placeholder="New group name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowNewGroup(false)
                          setNewGroupName('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 pt-4 border-t flex-shrink-0">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={!file || loading}>
                {loading ? 'Importing...' : 'Import Contacts'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Import Complete</h3>
              <p className="text-gray-500">
                Successfully imported <span className="font-semibold text-green-600">{result.success}</span> contacts
              </p>
              {result.failed > 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  {result.failed} rows skipped due to errors
                </p>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleDone}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
