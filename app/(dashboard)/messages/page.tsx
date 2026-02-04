'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MessageCircle,
  Send,
  Plus,
  ArrowLeft,
} from 'lucide-react'
import type { Conversation, Message, UserProfile } from '@/lib/types'

type ConversationWithMeta = Conversation & {
  otherParticipant?: UserProfile & { user_id: string }
  lastMessage?: Message | null
  unreadCount?: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const [orgUsers, setOrgUsers] = useState<UserProfile[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const searchParams = useSearchParams()

  const selectedConversation = conversations.find((c) => c.id === selectedId)

  const fetchConversations = async (userId: string) => {
    const { data: myConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId)

    const convIds = (myConvs || []).map((r) => r.conversation_id)
    if (convIds.length === 0) {
      setConversations([])
      return
    }

    const { data: convs } = await supabase
      .from('conversations')
      .select('id, created_at, updated_at')
      .in('id', convIds)
      .order('updated_at', { ascending: false })

    if (!convs?.length) {
      setConversations([])
      return
    }

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds)

    const userIds = Array.from(new Set((participants || []).map((p) => p.user_id)))
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

    const { data: allMessages } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })

    const lastByConv = new Map<string, Message>()
    for (const m of allMessages || []) {
      if (!lastByConv.has(m.conversation_id)) {
        lastByConv.set(m.conversation_id, m as Message)
      }
    }

    const { data: reads } = await supabase
      .from('conversation_reads')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)
      .in('conversation_id', convIds)

    const readMap = new Map((reads || []).map((r) => [r.conversation_id, r.last_read_at]))

    const list: ConversationWithMeta[] = convs.map((c) => {
      const convParticipants = (participants || []).filter((p) => p.conversation_id === c.id)
      const other = convParticipants.find((p) => p.user_id !== userId)
      const otherProfile = other ? profileMap.get(other.user_id) : null
      const lastMsg = lastByConv.get(c.id) || null
      const lastRead = readMap.get(c.id)
      const unreadCount = lastRead
        ? (allMessages || []).filter(
            (m) =>
              m.conversation_id === c.id &&
              m.sender_id !== userId &&
              new Date(m.created_at) > new Date(lastRead)
          ).length
        : (allMessages || []).filter(
            (m) => m.conversation_id === c.id && m.sender_id !== userId
          ).length

      return {
        ...c,
        otherParticipant: other
          ? { ...otherProfile, user_id: other.user_id } as UserProfile & { user_id: string }
          : undefined,
        lastMessage: lastMsg,
        unreadCount,
      }
    })

    setConversations(list)
  }

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    setMessages((data as Message[]) || [])

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('conversation_reads').upsert(
        {
          conversation_id: conversationId,
          user_id: user.id,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: 'conversation_id,user_id' }
      )
    }
  }

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setCurrentUserId(user.id)

    await fetchConversations(user.id)

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profile?.organization_id) {
      const { data: orgList } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url, role')
        .eq('organization_id', profile.organization_id)
        .neq('id', user.id)
      setOrgUsers((orgList || []) as UserProfile[])
    }

    setLoading(false)
  }

  const handledUserParam = useRef(false)
  const userParam = searchParams.get('user')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (
      userParam &&
      currentUserId &&
      userParam !== currentUserId &&
      !handledUserParam.current
    ) {
      handledUserParam.current = true
      supabase
        .rpc('get_or_create_conversation', { p_other_user_id: userParam })
        .then(({ data, error }) => {
          if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
            return
          }
          if (data) {
            fetchConversations(currentUserId).then(() => setSelectedId(data))
            window.history.replaceState({}, '', '/messages')
          }
        })
    }
  }, [currentUserId, userParam])

  useEffect(() => {
    if (selectedId && currentUserId) {
      fetchMessages(selectedId)
      fetchConversations(currentUserId)
    }
  }, [selectedId, currentUserId])

  // Poll for new messages every 5 seconds when a conversation is selected
  useEffect(() => {
    if (!selectedId || !currentUserId) return
    const interval = setInterval(() => {
      fetchMessages(selectedId)
      fetchConversations(currentUserId)
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedId, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!content.trim() || !selectedId || !currentUserId) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedId,
      sender_id: currentUserId,
      content: content.trim(),
    })
    setSending(false)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    setContent('')
    await fetchMessages(selectedId)
    await fetchConversations(currentUserId)
  }

  const [startingConversation, setStartingConversation] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const handleNewConversation = async (otherUserId: string) => {
    setStartingConversation(true)
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_other_user_id: otherUserId,
      })
      
      if (error) {
        console.error('RPC error:', error)
        toast({ 
          title: 'Error starting conversation', 
          description: error.message || 'The messaging database may not be set up. Please run the schema_messaging.sql migration.', 
          variant: 'destructive' 
        })
        setStartingConversation(false)
        return
      }
      
      if (data) {
        setNewMessageOpen(false)
        await fetchConversations(currentUserId!)
        setSelectedId(data)
      } else {
        toast({ 
          title: 'Error', 
          description: 'Could not start conversation. Users must be in the same organization.', 
          variant: 'destructive' 
        })
      }
    } catch (err) {
      console.error('Conversation error:', err)
      toast({ 
        title: 'Error', 
        description: 'Failed to start conversation. Check browser console for details.', 
        variant: 'destructive' 
      })
    }
    setStartingConversation(false)
  }

  const displayName = (p: UserProfile & { user_id?: string } | undefined) =>
    p?.full_name?.trim() || 'Unknown'

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row p-4 md:p-6 gap-4">
      {/* Conversation list */}
      <div
        className={
          selectedId
            ? 'hidden md:flex md:w-80 lg:w-96 flex-col border rounded-lg bg-white overflow-hidden'
            : 'flex flex-col w-full md:w-80 lg:w-96 border rounded-lg bg-white overflow-hidden'
        }
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <Button size="sm" variant="outline" onClick={() => setNewMessageOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No conversations yet. Start one with a teammate.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setSelectedId(conv.id)}
                className={
                  'w-full flex items-center gap-3 p-4 text-left border-b hover:bg-gray-50 transition-colors ' +
                  (selectedId === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : '')
                }
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    {displayName(conv.otherParticipant)
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {displayName(conv.otherParticipant)}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {conv.lastMessage
                      ? conv.lastMessage.sender_id === currentUserId
                        ? `You: ${conv.lastMessage.content}`
                        : conv.lastMessage.content
                      : 'No messages yet'}
                  </p>
                </div>
                {conv.unreadCount && conv.unreadCount > 0 ? (
                  <span className="shrink-0 rounded-full bg-blue-600 text-white text-xs font-medium px-2 py-0.5">
                    {conv.unreadCount}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation view */}
      <div
        className={
          'flex-1 flex flex-col border rounded-lg bg-white overflow-hidden ' +
          (selectedId ? 'flex' : 'hidden md:flex')
        }
      >
        {selectedId && selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedId(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {displayName(selectedConversation.otherParticipant)
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium text-gray-900">
                {displayName(selectedConversation.otherParticipant)}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId
                return (
                  <div
                    key={msg.id}
                    className={'flex ' + (isMe ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={
                        'max-w-[75%] rounded-lg px-4 py-2 ' +
                        (isMe
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900')
                      }
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <p
                        className={
                          'text-xs mt-1 ' +
                          (isMe ? 'text-blue-200' : 'text-gray-400')
                        }
                      >
                        {new Date(msg.created_at).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            <form
              className="p-4 border-t flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
            >
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !content.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Select a conversation or start a new one</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setNewMessageOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New message
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New message: pick user */}
      <Dialog 
        open={newMessageOpen} 
        onOpenChange={(open) => {
          if (!startingConversation) {
            setNewMessageOpen(open)
            if (!open) setSelectedUserId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-3">
            Choose a teammate in your organization to message.
          </p>
          <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg">
            {orgUsers.length === 0 ? (
              <p className="text-sm text-gray-500 p-4">No other users in your organization.</p>
            ) : (
              orgUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUserId(u.id)}
                  disabled={startingConversation}
                  className={
                    'w-full flex items-center gap-3 p-3 text-left transition-colors ' +
                    (selectedUserId === u.id 
                      ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent')
                  }
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {(u.full_name || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900">{u.full_name || 'Unknown'}</span>
                </button>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setNewMessageOpen(false)
                setSelectedUserId(null)
              }}
              disabled={startingConversation}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => selectedUserId && handleNewConversation(selectedUserId)}
              disabled={!selectedUserId || startingConversation}
            >
              {startingConversation ? 'Starting...' : 'Start Conversation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
