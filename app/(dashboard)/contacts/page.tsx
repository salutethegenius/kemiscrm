'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Search, Mail, Phone, Building, Upload, Users, Tag, Trash2, Kanban, LayoutGrid, List, LayoutList, Download } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ContactDialog } from '@/components/contacts/contact-dialog'
import { ImportDialog } from '@/components/contacts/import-dialog'
import { GroupDialog } from '@/components/contacts/group-dialog'
import { TagManager } from '@/components/contacts/tag-manager'
import { DealDialog } from '@/components/pipeline/deal-dialog'
import { AddToPipelineDialog } from '@/components/contacts/add-to-pipeline-dialog'
import { ExportDialog } from '@/components/contacts/export-dialog'
import type { Contact, ContactGroup, ContactTag, PipelineStage } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  new: 'default',
  contacted: 'secondary',
  qualified: 'warning',
  converted: 'success',
  lost: 'destructive',
}

type TabType = 'all' | 'groups'
type ViewType = 'grid' | 'list' | 'compact'

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
  const [dealDialogOpen, setDealDialogOpen] = useState(false)
  const [contactForDeal, setContactForDeal] = useState<Contact | null>(null)
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set())
  const [bulkPipelineDialogOpen, setBulkPipelineDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('list')
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

  const fetchPipelineStages = async () => {
    const { data } = await supabase.from('pipeline_stages').select('*').order('position')
    setPipelineStages(data || [])
  }

  useEffect(() => {
    fetchContacts()
    fetchGroups()
    fetchTags()
    fetchPipelineStages()
  }, [])

  const handleAddToPipeline = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation()
    setContactForDeal(contact)
    setDealDialogOpen(true)
  }

  const handleDealDialogSuccess = () => {
    setDealDialogOpen(false)
    setContactForDeal(null)
  }

  const toggleSelectContact = (e: React.MouseEvent, contactId: string) => {
    e.stopPropagation()
    setSelectedContactIds((prev) => {
      const next = new Set(prev)
      if (next.has(contactId)) next.delete(contactId)
      else next.add(contactId)
      return next
    })
  }

  const clearSelection = () => {
    setSelectedContactIds(new Set())
  }

  // Define filteredContacts FIRST, then derived values
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.email.toLowerCase().includes(search.toLowerCase()) ||
      contact.company?.toLowerCase().includes(search.toLowerCase())

    if (selectedGroup) {
      return matchesSearch && contact.groups?.some(g => g.id === selectedGroup)
    }

    return matchesSearch
  })

  const selectAllFiltered = () => {
    setSelectedContactIds(new Set(filteredContacts.map((c) => c.id)))
  }

  const isAllFilteredSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedContactIds.has(c.id))
  const selectedContacts = filteredContacts.filter((c) => selectedContactIds.has(c.id))

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
          <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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
            {/* View Toggle */}
            <div className="flex items-center border rounded-lg p-1 bg-gray-50">
              <Button
                variant={viewType === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="px-2"
                onClick={() => setViewType('grid')}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewType === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="px-2"
                onClick={() => setViewType('list')}
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewType === 'compact' ? 'default' : 'ghost'}
                size="sm"
                className="px-2"
                onClick={() => setViewType('compact')}
                title="Compact view"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
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

          {/* Bulk selection bar */}
          {!loading && filteredContacts.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-contacts"
                  checked={isAllFilteredSelected}
                  onCheckedChange={(checked) => {
                    if (checked) selectAllFiltered()
                    else clearSelection()
                  }}
                />
                <label
                  htmlFor="select-all-contacts"
                  className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                >
                  Select all
                </label>
              </div>
              {selectedContactIds.size > 0 && (
                <>
                  <span className="text-sm text-gray-500">
                    {selectedContactIds.size} selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setBulkPipelineDialogOpen(true)}
                  >
                    <Kanban className="h-4 w-4 mr-2" />
                    Add {selectedContactIds.size} to pipeline
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Contacts Display */}
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
          ) : viewType === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => (
                <Card 
                  key={contact.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleEdit(contact)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className="flex items-center pt-1"
                        onClick={(e) => toggleSelectContact(e, contact.id)}
                      >
                        <Checkbox
                          checked={selectedContactIds.has(contact.id)}
                          onCheckedChange={() => {}}
                        />
                      </div>
                      <Avatar className="h-12 w-12 shrink-0">
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
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">Added {formatDate(contact.created_at)}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => handleAddToPipeline(e, contact)}
                          >
                            <Kanban className="h-3.5 w-3.5 mr-1" />
                            Add to Pipeline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : viewType === 'list' ? (
            /* List View (Table) */
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredContacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleEdit(contact)}
                      >
                        <td className="px-4 py-3" onClick={(e) => toggleSelectContact(e, contact.id)}>
                          <Checkbox
                            checked={selectedContactIds.has(contact.id)}
                            onCheckedChange={() => {}}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                                {contact.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-gray-900">{contact.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{contact.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{contact.phone || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{contact.company || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusColors[contact.status]}>{contact.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {contact.tags && contact.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {contact.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                              {contact.tags.length > 2 && (
                                <span className="text-xs text-gray-400">+{contact.tags.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(contact.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => handleAddToPipeline(e, contact)}
                          >
                            <Kanban className="h-3.5 w-3.5 mr-1" />
                            Pipeline
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* Compact View */
            <Card>
              <div className="divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEdit(contact)}
                  >
                    <div onClick={(e) => toggleSelectContact(e, contact.id)}>
                      <Checkbox
                        checked={selectedContactIds.has(contact.id)}
                        onCheckedChange={() => {}}
                      />
                    </div>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                        {contact.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      <span className="font-medium text-gray-900 truncate w-40">{contact.name}</span>
                      <span className="text-sm text-gray-500 truncate w-48 hidden sm:block">{contact.email}</span>
                      <span className="text-sm text-gray-500 w-28 hidden md:block">{contact.phone || '—'}</span>
                      <span className="text-sm text-gray-500 truncate w-32 hidden lg:block">{contact.company || '—'}</span>
                    </div>
                    <Badge variant={statusColors[contact.status]} className="shrink-0">{contact.status}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={(e) => handleAddToPipeline(e, contact)}
                    >
                      <Kanban className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
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

      <DealDialog
        open={dealDialogOpen}
        onClose={() => { setDealDialogOpen(false); setContactForDeal(null) }}
        onSuccess={handleDealDialogSuccess}
        stages={pipelineStages}
        contacts={contacts}
        defaultContactId={contactForDeal?.id ?? null}
        defaultStageId={pipelineStages[0]?.id ?? null}
      />

      <AddToPipelineDialog
        open={bulkPipelineDialogOpen}
        onClose={() => setBulkPipelineDialogOpen(false)}
        onSuccess={() => {
          clearSelection()
          fetchContacts()
        }}
        contacts={selectedContacts}
      />

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        contacts={contacts}
        groups={groups}
        selectedContactIds={selectedContactIds}
      />
    </div>
  )
}
