import type { Metadata } from 'next'
import { MessageSquare } from 'lucide-react'

export const metadata: Metadata = { title: 'Chat' }

export default function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">Chat</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Real-time messaging with clients, agents, and your internal team.
      </p>
    </div>
  )
}
