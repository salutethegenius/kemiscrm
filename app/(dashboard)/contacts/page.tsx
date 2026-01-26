'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Search, Mail, Phone, Building, Upload, Users, Tag, Trash2 } from 'lucide-react'
import { ContactDialog } from '@/components/contacts/contact-dialog'
import { ImportDialog } from '@/components/contacts/import-dialog'
import { GroupDialog } from '@/components/contacts/group-dialog'
import { TagManager } from '@/components/contacts/tag-manager'
import type { Contact, ContactGroup, ContactTag } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  new: 'default',
  contacted: 'secondary',
  qualified: 'warning',
  converted: 'success',
  lost: 'destructive',
}

type TabType = 'all' | 'groups'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [tags, setTags] = useState<ContactTag[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_tag_assignments(tag_id, contact_tags(*)),
        contact_group_members(group_id, contact_groups(*))
      `)
      .order('created_at', { ascending: false })

    if (error) {
      // Fallback if new tables don't exist yet
      const { data: basicData } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
      setContacts(basicData || [])
    } else {
      // Transform data to include tags and groups
      const transformedContacts = data?.map(contact => ({
        ...contact,
        tags: contact.contact_tag_assignments?.map((a: any) => a.contact_tags).filter(Boolean) || [],
        groups: contact.contact_group_members?.map((m: any) => m.contact_groups).filter(Boolean) || [],
      })) || []
      setContacts(transformedContacts)
    }
    setLoading(false)
  }

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('contact_groups')
      .select('*, contact_group_members(count)')
      .order('name')

    if (data) {
      const groupsWithCount = data.map(g => ({
        ...g,
        member_count: g.contact_group_members?.[0]?.count || 0,
      }))
      setGroups(groupsWithCount)
    }
  }

  const fetchTags = async () => {
    const { data } = await supabase
      .from('contact_tags')
      .select('*')
      .order('name')

    setTags(data || [])
  }

  useEffect(() => {
    fetchContacts()
    fetchGroups()
    fetchTags()
  }, [])

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.email.toLowerCase().includes(search.toLowerCase()) ||
      contact.company?.toLowerCase().includes(search.toLowerCase())

    if (selectedGroup) {
      return matchesSearch && contact.groups?.some(g => g.id === selectedGroup)
    }

    return matchesSearch
  })

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setDialogOpen(true)
  }

  const handleEditGroup = (group: ContactGroup) => {
    setEditingGroup(group)
    setGroupDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditingContact(null)
  }

  const handleCloseGroup = () => {
    setGroupDialogOpen(false)
    setEditingGroup(null)
  }

  const handleSuccess = () => {
    handleClose()
    fetchContacts()
  }

  const handleGroupSuccess = () => {
    handleCloseGroup()
    fetchGroups()
    fetchContacts()
  }

  const handleDeleteGroup = async (group: ContactGroup) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"? This will remove the group but not the contacts.`)) {
      return
    }

    const { error } = await supabase
      .from('contact_groups')
      .delete()
      .eq('id', group.id)

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Group deleted',
      description: `"${group.name}" has been removed.`,
    })

    fetchGroups()
    fetchContacts()
  }

  const handleImportSuccess = () => {
    setImportDialogOpen(false)
    fetchContacts()
    fetchGroups()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 mt-1">Manage your leads and contacts</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b">
        <button
          onClick={() => { setActiveTab('all'); setSelectedGroup(null); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Contacts
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'groups'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="h-4 w-4 inline mr-1" />
          Groups
        </button>
      </div>

      {activeTab === 'all' && (
        <>
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <TagManager tags={tags} onUpdate={fetchTags} />
          </div>

          {/* Selected Group Filter */}
          {selectedGroup && (
            <div className="mb-4 flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filtering by group:</span>
              <Badge variant="secondary">
                {groups.find(g => g.id === selectedGroup)?.name}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setSelectedGroup(null)}>
                Clear
              </Button>
            </div>
          )}

          {/* Contacts Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 mb-4">
                  {search ? 'No contacts match your search.' : 'No contacts yet. Add your first contact to get started.'}
                </p>
                {!search && (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => (
                <Card 
                  key={contact.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleEdit(contact)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                          {contact.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
                          <Badge variant={statusColors[contact.status]}>{contact.status}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.company && (
                            <div className="flex items-center">
                              <Building className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                              <span className="truncate">{contact.company}</span>
                            </div>
                          )}
                        </div>
                        {/* Tags */}
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {contact.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {contact.tags.length > 3 && (
                              <span className="text-xs text-gray-400">+{contact.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Added {formatDate(contact.created_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'groups' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-500">Organize your contacts into groups</p>
            <Button onClick={() => setGroupDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No groups yet. Create a group to organize your contacts.</p>
                <Button onClick={() => setGroupDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <Card 
                  key={group.id} 
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${group.color}20` }}
                        >
                          <Users className="h-6 w-6" style={{ color: group.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                          <p className="text-sm text-gray-500">
                            {group.member_count} {group.member_count === 1 ? 'contact' : 'contacts'}
                          </p>
                          {group.description && (
                            <p className="text-xs text-gray-400 mt-1 truncate">{group.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGroup(group)
                        }}
                        title="Delete group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedGroup(group.id)
                          setActiveTab('all')
                        }}
                      >
                        View Contacts
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditGroup(group)
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <ContactDialog
        open={dialogOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        contact={editingContact}
        tags={tags}
        groups={groups}
      />

      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={handleImportSuccess}
        groups={groups}
      />

      <GroupDialog
        open={groupDialogOpen}
        onClose={handleCloseGroup}
        onSuccess={handleGroupSuccess}
        group={editingGroup}
        contacts={contacts}
      />
    </div>
  )
}
