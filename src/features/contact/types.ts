export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  role: string
  status: 'Active' | 'Inactive' | 'Lead' | 'On Hold'
  deals: number
  value: number
  tags: string[]
  notes: string
  assignedTo: string
  createdAt: string
}
