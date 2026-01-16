import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { callAIAgent } from '@/utils/aiAgent'
import type { NormalizedAgentResponse } from '@/utils/aiAgent'
import {
  Database,
  Plus,
  RefreshCw,
  ExternalLink,
  Pencil,
  Trash2,
  Calendar,
  Users,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  BarChart
} from 'lucide-react'

// Agent ID from workflow.json
const AGENT_ID = "696a74c59ea90559bbf3f052"

// TypeScript interfaces from actual_test_response
interface Contact {
  name: string
  email: string
  company: string
  email_count: number
  last_interaction: string
  notion_page_url: string
}

interface ScanDateRange {
  start: string
  end: string
}

interface HarvestResult {
  list_name: string
  notion_database_url: string
  contacts_added: number
  contacts_updated: number
  total_contacts: number
  total_emails_logged: number
  scan_date_range: ScanDateRange
  contacts: Contact[]
}

interface CompanyList {
  id: string
  list_name: string
  domains: string[]
  contacts: number
  emails_logged: number
  last_scan: string
  status: 'active' | 'scanning' | 'error'
  notion_url?: string
}

// Stats Card Component
function StatsCard({ icon: Icon, label, value, trend }: { icon: any; label: string; value: string | number; trend?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Add Company List Modal Component
function AddListModal({ onListCreated }: { onListCreated: (result: HarvestResult) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [listName, setListName] = useState('')
  const [domainInput, setDomainInput] = useState('')
  const [domains, setDomains] = useState<string[]>([])
  const [datePreset, setDatePreset] = useState('30')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const addDomain = () => {
    if (domainInput.trim() && !domains.includes(domainInput.trim())) {
      setDomains([...domains, domainInput.trim()])
      setDomainInput('')
    }
  }

  const removeDomain = (domain: string) => {
    setDomains(domains.filter(d => d !== domain))
  }

  const calculateDateRange = () => {
    if (datePreset === 'custom') {
      return { start_date: startDate, end_date: endDate }
    }

    // Use yesterday as end date to avoid "future" errors (agent needs time to index emails)
    const end = new Date()
    end.setDate(end.getDate() - 1) // Go back one day
    end.setHours(0, 0, 0, 0)

    const start = new Date(end)
    start.setDate(start.getDate() - parseInt(datePreset))

    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0]
    }
  }

  const handleCreateScan = async () => {
    if (!listName.trim() || domains.length === 0) return

    setLoading(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const dateRange = calculateDateRange()
      const input = JSON.stringify({
        list_name: listName,
        target_domains: domains,
        date_range: dateRange
      })

      const result = await callAIAgent(input, AGENT_ID)

      if (result.success && result.response.status === 'success') {
        const harvestResult = result.response.result as HarvestResult
        setSuccessMessage(
          `Successfully created "${harvestResult.list_name}"! Found ${harvestResult.total_contacts} contacts with ${harvestResult.total_emails_logged} emails logged.`
        )
        onListCreated(harvestResult)

        // Close modal after showing success for 2 seconds
        setTimeout(() => {
          setOpen(false)
          setListName('')
          setDomains([])
          setDomainInput('')
          setDatePreset('30')
          setSuccessMessage(null)
        }, 2000)
      } else {
        setErrorMessage(result.response.message || 'Scan failed. Please try again.')
      }
    } catch (error) {
      console.error('Scan error:', error)
      setErrorMessage('An error occurred during scanning. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Company List
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Company List</DialogTitle>
          <DialogDescription>
            Add domains to scan and create a Notion database for tracking contacts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="list-name">List Name</Label>
            <Input
              id="list-name"
              placeholder="e.g., Acme Corp Partners"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Company Domains</Label>
            <p className="text-xs text-gray-500 mt-1 mb-2">
              Type a domain and click the + button to add it to the search
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., acme.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addDomain()
                  }
                }}
              />
              <Button onClick={addDomain} type="button" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {domains.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {domains.map((domain) => (
                  <Badge key={domain} variant="secondary" className="gap-1">
                    {domain}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={() => removeDomain(domain)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Date Range</Label>
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {datePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            </div>
          )}

          <Button
            onClick={handleCreateScan}
            disabled={loading || !listName.trim() || domains.length === 0}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating & Scanning...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Create & Scan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Contact Details Panel Component
function ContactDetailsPanel({ contact }: { contact: Contact }) {
  const [showNotionPreview, setShowNotionPreview] = useState(false)

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Email Log Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                <p className="text-sm text-gray-600">{contact.email}</p>
                <p className="text-sm text-gray-500">{contact.company}</p>
              </div>
              <Badge variant="outline" className="bg-blue-50">
                {contact.email_count} emails
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Last interaction: {contact.last_interaction}</span>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setShowNotionPreview(true)}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Database className="h-4 w-4 mr-2" />
                  View Notion Page Preview
                </Button>

                <a
                  href={contact.notion_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 px-3 py-2 rounded hover:bg-blue-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open full page in Notion
                </a>
              </div>
            </div>

            <Separator />

            <div className="text-sm text-gray-500">
              <p className="mb-2 font-medium">Email History:</p>
              <p>Complete email interaction log is available in the Notion page. Click the button above to preview or open in Notion to view all {contact.email_count} emails with subjects, dates, and snippets.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notion Page Preview Modal */}
      <Dialog open={showNotionPreview} onOpenChange={setShowNotionPreview}>
        <DialogContent className="max-w-5xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Notion Page: {contact.name}
            </DialogTitle>
            <DialogDescription>
              Email interaction log from Notion
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50">
            <div className="p-6 space-y-4">
              {/* Contact Summary */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                    <p className="text-sm text-gray-600">{contact.email}</p>
                    <p className="text-sm text-gray-500">{contact.company}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">
                    {contact.email_count} emails
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Last interaction: {contact.last_interaction}</span>
                </div>
              </div>

              {/* Email Log Preview */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Interaction Log
                </h4>
                <div className="space-y-3 max-h-[calc(85vh-400px)] overflow-y-auto">
                  {/* Sample email entries - in production, these would come from the agent */}
                  {Array.from({ length: contact.email_count }).map((_, idx) => (
                    <div key={idx} className="pb-3 border-b last:border-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {idx === 0 ? 'Re: Partnership Discussion' :
                           idx === 1 ? 'Follow-up: Q4 Planning' :
                           idx === 2 ? 'Meeting Notes - Product Review' :
                           `Email Thread ${idx + 1}`}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(Date.now() - idx * 86400000 * 2).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {idx === 0 ? 'Thanks for the detailed discussion yesterday. I have reviewed the proposal and...' :
                         idx === 1 ? 'Following up on our conversation about Q4 planning. Here are my thoughts on...' :
                         idx === 2 ? 'Great meeting today! Here are the key points we discussed regarding the product...' :
                         'Email content preview would appear here with subject, date, and snippet...'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notion Link */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      View Full Details in Notion
                    </p>
                    <p className="text-xs text-blue-700 mb-2">
                      Complete email history with attachments, tags, and collaboration features available in your Notion workspace
                    </p>
                    <a
                      href={contact.notion_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Notion
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {contact.email_count} emails logged in Notion
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNotionPreview(false)}
              >
                Close
              </Button>
              <a
                href={contact.notion_page_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Notion
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Main Home Component
export default function Home() {
  const [companyLists, setCompanyLists] = useState<CompanyList[]>([
    {
      id: '1',
      list_name: 'Acme Corp',
      domains: ['acme.com', 'acmecorp.io'],
      contacts: 47,
      emails_logged: 234,
      last_scan: '2026-01-15',
      status: 'active',
      notion_url: 'https://notion.so/database/acme123'
    }
  ])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [scanResult, setScanResult] = useState<HarvestResult | null>(null)
  const [activeTab, setActiveTab] = useState<'lists' | 'scan-results'>('lists')

  // Sample contacts for demo
  const sampleContacts: Contact[] = scanResult?.contacts || [
    {
      name: 'John Smith',
      email: 'john.smith@acme.com',
      company: 'Acme Corp',
      email_count: 5,
      last_interaction: '2026-01-14',
      notion_page_url: 'https://notion.so/page/john123'
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.j@acme.com',
      company: 'Acme Corp',
      email_count: 12,
      last_interaction: '2026-01-13',
      notion_page_url: 'https://notion.so/page/sarah456'
    }
  ]

  const handleListCreated = (result: HarvestResult) => {
    const newList: CompanyList = {
      id: Date.now().toString(),
      list_name: result.list_name,
      domains: [],
      contacts: result.total_contacts,
      emails_logged: result.total_emails_logged,
      last_scan: result.scan_date_range.end,
      status: 'active',
      notion_url: result.notion_database_url
    }
    setCompanyLists([...companyLists, newList])
    setScanResult(result)
    setActiveTab('scan-results')
  }

  const deleteList = (id: string) => {
    setCompanyLists(companyLists.filter(list => list.id !== id))
  }

  const totalContacts = companyLists.reduce((sum, list) => sum + list.contacts, 0)
  const totalEmailsLogged = companyLists.reduce((sum, list) => sum + list.emails_logged, 0)
  const activeLists = companyLists.filter(list => list.status === 'active').length
  const lastScan = companyLists.length > 0
    ? companyLists.sort((a, b) => new Date(b.last_scan).getTime() - new Date(a.last_scan).getTime())[0].last_scan
    : 'N/A'

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 p-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Email Harvester</h1>
          </div>
          <p className="text-xs text-gray-500">Pro Edition</p>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('lists')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'lists'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">Company Lists</span>
          </button>

          <button
            onClick={() => setActiveTab('scan-results')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'scan-results'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart className="h-4 w-4" />
            <span className="text-sm font-medium">Scan Results</span>
          </button>
        </nav>

        <Separator className="my-6" />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-gray-600">Gmail Connected</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-gray-600">Notion Connected</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {activeTab === 'lists' ? 'Company Lists' : 'Scan Results'}
              </h2>
              <p className="text-gray-600 mt-1">
                {activeTab === 'lists'
                  ? 'Manage your email harvesting lists and view contact databases'
                  : 'View detailed scan results and contact information'}
              </p>
            </div>
            {activeTab === 'lists' && <AddListModal onListCreated={handleListCreated} />}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon={Users}
              label="Total Contacts"
              value={totalContacts}
              trend="+12% this month"
            />
            <StatsCard
              icon={Database}
              label="Active Lists"
              value={activeLists}
            />
            <StatsCard
              icon={Calendar}
              label="Last Scan"
              value={lastScan}
            />
            <StatsCard
              icon={Mail}
              label="Emails Logged"
              value={totalEmailsLogged}
            />
          </div>
        </div>

        {/* Company Lists Table */}
        {activeTab === 'lists' && (
          <Card>
            <CardHeader>
              <CardTitle>All Company Lists</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>List Name</TableHead>
                    <TableHead>Notion Database</TableHead>
                    <TableHead>Domains</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead>Emails Logged</TableHead>
                    <TableHead>Last Scan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyLists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell className="font-medium">{list.list_name}</TableCell>
                      <TableCell>
                        {list.notion_url ? (
                          <a
                            href={list.notion_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <Database className="h-4 w-4" />
                            <span className="truncate max-w-[150px]">{list.list_name}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">Not created</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {list.domains.map((domain) => (
                            <Badge key={domain} variant="outline" className="text-xs">
                              {domain}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{list.contacts}</TableCell>
                      <TableCell>{list.emails_logged}</TableCell>
                      <TableCell>{list.last_scan}</TableCell>
                      <TableCell>
                        <Badge
                          variant={list.status === 'active' ? 'default' : 'secondary'}
                          className={
                            list.status === 'active'
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : ''
                          }
                        >
                          {list.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {list.status === 'scanning' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {list.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {list.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Update
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteList(list.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Scan Results View */}
        {activeTab === 'scan-results' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Contacts Table */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Contacts</CardTitle>
                <p className="text-sm text-gray-600">
                  {scanResult ? scanResult.total_contacts : sampleContacts.length} contacts found
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Last Interaction</TableHead>
                        <TableHead>Emails</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleContacts.map((contact) => (
                        <TableRow
                          key={contact.email}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedContact(contact)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-xs text-gray-500">{contact.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{contact.company}</TableCell>
                          <TableCell className="text-sm">{contact.last_interaction}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{contact.email_count}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Email Log Preview Panel */}
            <div className="col-span-1">
              {selectedContact ? (
                <ContactDetailsPanel contact={selectedContact} />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent>
                    <div className="text-center text-gray-500">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Select a contact to view email log</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Scan Result Success Message */}
        {scanResult && activeTab === 'scan-results' && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">
                    Scan completed successfully for "{scanResult.list_name}"
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {scanResult.contacts_added} new contacts added, {scanResult.contacts_updated} updated.
                    Total: {scanResult.total_contacts} contacts, {scanResult.total_emails_logged} emails logged.
                  </p>
                  <a
                    href={scanResult.notion_database_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-900 mt-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Notion Database
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
