// ─── Mock API — full in-memory backend ───────────────────────
// Used when VITE_API_URL is not set (no backend running).
// Switch to real API by setting VITE_API_URL=http://localhost:8000

const delay = (ms = 120) => new Promise(r => setTimeout(r, ms))

// ── Departments ──────────────────────────────────────────────
let _departments = [
  { id: 1, name: 'Digital & Web',         color: '#3B82F6', isArchived: false },
  { id: 2, name: 'Performance Marketing', color: '#8B5CF6', isArchived: false },
  { id: 3, name: 'Growth & Automation',   color: '#00CEC9', isArchived: false },
  { id: 4, name: 'Management',            color: '#64748B', isArchived: false },
]

// ── Mutable Categories — keyed by departmentId ───────────────
let _categories = {
  1: ['Web', 'Design', 'Backend', 'Content', 'Report'],
  2: ['Emailer', 'Analysis', 'Social', 'Lead', 'Report'],
  3: ['Content', 'Social', 'Lead', 'Report', 'Other'],
  4: ['Report', 'Other'],
}

// ── Seed data ────────────────────────────────────────────────
let _users = [
  { id:1,  name:'Nikhil Raut',     email:'admin@integers.in',           password:'admin123',   role:'admin',   status:'Active', departmentId:4, added:'2025-01-01' },
  { id:2,  name:'Sagar Devlekar',  email:'sagar@umangglobal.com',       password:'manager123', role:'manager', status:'Active', departmentId:4, added:'2026-04-25' },
  { id:3,  name:'Virendra Kini',   email:'digital2@umangglobal.com',    password:'lead123',    role:'lead',    status:'Active', departmentId:1, added:'2026-04-25' },
  { id:4,  name:'Devendra R',      email:'digital1@umangglobal.com',    password:'lead123',    role:'lead',    status:'Active', departmentId:2, added:'2026-04-25' },
  { id:5,  name:'Yukta Moolya',    email:'yukta@aintegers.com',         password:'lead123',    role:'lead',    status:'Active', departmentId:3, added:'2026-04-25' },
  { id:6,  name:'Omkar B',         email:'digital4@umangglobal.com',    password:'manager123', role:'manager', status:'Active', departmentId:2, added:'2026-04-25' },
  { id:7,  name:'Vinit Pandhre',   email:'digital5@umangglobal.com',    password:'user123',    role:'user',    status:'Active', departmentId:1, added:'2026-04-25' },
  { id:8,  name:'Aishwarya S',     email:'digital7@umangglobal.com',    password:'user123',    role:'user',    status:'Active', departmentId:1, added:'2026-04-25' },
  { id:9,  name:'Sahil P',         email:'digital6@umangglobal.com',    password:'user123',    role:'user',    status:'Active', departmentId:2, added:'2026-04-25' },
  { id:10, name:'Neel Naik',       email:'neel@aintegers.com',          password:'user123',    role:'user',    status:'Active', departmentId:3, added:'2026-04-25' },
  { id:11, name:'Amarjit Gupta',   email:'automation@aintegers.com',    password:'user123',    role:'user',    status:'Active', departmentId:3, added:'2026-04-25' },
  { id:12, name:'Ayushi Nainwani', email:'ayushi@integersinsights.com', password:'user123',    role:'user',    status:'Active', departmentId:3, added:'2026-04-25' },
]

let _tasks = [
  { id:1,  departmentId:1, description:'SEO audit & keyword strategy Q2',            assignedTo:'Virendra Kini',  week:17, category:'Web',      progress:65,  dueDate:'2026-05-15', status:'In Progress',      clientType:['B2B'], delegationChain:[], kpiId:null, submittedAt:null, submittedBy:null, approvedAt:null, approvedBy:null },
  { id:2,  departmentId:1, description:'Instagram reels content calendar',           assignedTo:'Aishwarya S',    week:17, category:'Social',   progress:40,  dueDate:'2026-05-10', status:'In Progress',      clientType:['B2C'], delegationChain:[], kpiId:null, submittedAt:null, submittedBy:null, approvedAt:null, approvedBy:null },
  { id:3,  departmentId:2, description:'May email newsletter design',                assignedTo:'Devendra R',     week:17, category:'Emailer',  progress:20,  dueDate:'2026-05-08', status:'Not Started',      clientType:['B2C'], delegationChain:[], kpiId:null, submittedAt:null, submittedBy:null, approvedAt:null, approvedBy:null },
  { id:4,  departmentId:2, description:'Competitor analysis report',                 assignedTo:'Omkar B',        week:16, category:'Analysis', progress:80,  dueDate:'2026-05-05', status:'Review',           clientType:['B2B'], delegationChain:[], kpiId:null, submittedAt:null, submittedBy:null, approvedAt:null, approvedBy:null },
  { id:5,  departmentId:3, description:'LinkedIn growth campaign setup',             assignedTo:'Amarjit Gupta',  week:17, category:'Lead',     progress:55,  dueDate:'2026-05-12', status:'In Progress',      clientType:['Int'], delegationChain:[], kpiId:null, submittedAt:null, submittedBy:null, approvedAt:null, approvedBy:null },
  { id:6,  departmentId:1, description:'Website landing page redesign',              assignedTo:'Vinit Pandhre',  week:16, category:'Design',   progress:100, dueDate:'2026-04-30', status:'Completed',        clientType:['B2B'], delegationChain:[], kpiId:null, submittedAt:'2026-04-29T17:00:00Z', submittedBy:'Vinit Pandhre', approvedAt:'2026-04-30T09:30:00Z', approvedBy:'Virendra Kini' },
  { id:7,  departmentId:2, description:'April campaign performance report',          assignedTo:'Sahil P',        week:16, category:'Report',   progress:100, dueDate:'2026-05-02', status:'Pending Approval', clientType:['B2C'], delegationChain:[], kpiId:null, submittedAt:new Date(Date.now()-7200000).toISOString(), submittedBy:'Sahil P', approvedAt:null, approvedBy:null },
  { id:8,  departmentId:3, description:'Automate lead nurture workflow',             assignedTo:'Ayushi Nainwani',week:17, category:'Backend',  progress:30,  dueDate:'2026-05-20', status:'In Progress',      clientType:['Int'], delegationChain:[], kpiId:null, submittedAt:null, submittedBy:null, approvedAt:null, approvedBy:null },
  { id:9,  departmentId:1, description:'Google Ads May budget planning',             assignedTo:'Virendra Kini',  week:17, category:'Lead',     progress:0,   dueDate:'2026-05-07', status:'Blocker',          clientType:['B2B'], delegationChain:[], kpiId:null, submittedAt:null, submittedBy:null, approvedAt:null, approvedBy:null },
  { id:10, departmentId:3, description:'Integers social media content plan',         assignedTo:'Neel Naik',      week:17, category:'Content',  progress:70,  dueDate:'2026-05-14', status:'In Progress',      clientType:['Int'], delegationChain:[], kpiId:null, submittedAt:null, submittedBy:null, approvedAt:null, approvedBy:null },
  { id:11, departmentId:2, description:'April email campaign performance',           assignedTo:'Devendra R',     week:15, category:'Emailer',  progress:100, dueDate:'2026-04-25', status:'Completed',        clientType:['B2C'], delegationChain:[], kpiId:null, submittedAt:'2026-04-24T18:00:00Z', submittedBy:'Devendra R', approvedAt:'2026-04-25T10:00:00Z', approvedBy:'Omkar B' },
  { id:12, departmentId:1, description:'Meta pixel integration check',               assignedTo:'Aishwarya S',    week:15, category:'Web',      progress:100, dueDate:'2026-04-22', status:'Completed',        clientType:['B2B'], delegationChain:[], kpiId:null, submittedAt:'2026-04-21T16:00:00Z', submittedBy:'Aishwarya S', approvedAt:'2026-04-22T11:00:00Z', approvedBy:'Virendra Kini' },
  { id:13, departmentId:4, description:'June ads schedule — all brands',             assignedTo:'Sagar Devlekar', week:19, category:'Report',   progress:0,   dueDate:'2026-05-23', status:'Not Started',      clientType:['B2B','B2C'], delegationChain:[], kpiId:null, submittedAt:null, submittedBy:null, approvedAt:null, approvedBy:null },
  { id:14, departmentId:1, description:'Technical SEO audit — mobile, schema, speed',assignedTo:'Virendra Kini',  week:3,  category:'Web',      progress:100, dueDate:'2026-05-08', status:'Pending Approval', clientType:['B2B'], delegationChain:[], kpiId:null, submittedAt:new Date(Date.now()-3600000).toISOString(), submittedBy:'Virendra Kini', approvedAt:null, approvedBy:null },
  { id:15, departmentId:2, description:'Website content rewrite',                    assignedTo:'Devendra R',     week:2,  category:'Content',  progress:0,   dueDate:'2026-05-20', status:'Not Started',      clientType:['B2C'], delegationChain:[], kpiId:null, submittedAt:null, submittedBy:null, approvedAt:null, approvedBy:null },
  { id:16, departmentId:1, description:'Keyword research & final matrix',            assignedTo:'Virendra Kini',  week:2,  category:'Web',      progress:0,   dueDate:'2026-05-15', status:'In Progress',      clientType:['B2B'], delegationChain:[], kpiId:null, submittedAt:null, submittedBy:null, approvedAt:null, approvedBy:null },
]

let _leads = [
  { id:1,  company:'Umang Global', name:'Rajesh Mehta',    email:'r.mehta@gmail.com',       phone:'9876543210', source:'LinkedIn',  date:'2026-04-28', status:'Qualified',   notes:'Interested in premium package' },
  { id:2,  company:'Consumer',     name:'Priya Sharma',    email:'priya.s@outlook.com',     phone:'9812345678', source:'Referral',  date:'2026-04-30', status:'Contacted',   notes:'' },
  { id:3,  company:'Integers',     name:'Sanjay Verma',    email:'sanjay@techcorp.in',      phone:'9900112233', source:'Website',   date:'2026-05-01', status:'New',         notes:'Came via contact form' },
  { id:4,  company:'Umang Global', name:'Anita Desai',     email:'anita.d@businessmail.in', phone:'9988776655', source:'Event',     date:'2026-05-02', status:'Proposal',    notes:'Sent proposal deck' },
  { id:5,  company:'Consumer',     name:'Vikram Singh',    email:'vikram@brand.com',        phone:'9111222333', source:'Instagram', date:'2026-05-03', status:'New',         notes:'Enquired about pricing' },
  { id:6,  company:'Umang Global', name:'Kavya Nair',      email:'kavya.n@startup.io',      phone:'9444555666', source:'LinkedIn',  date:'2026-05-04', status:'Closed Won',  notes:'Signed Q2 retainer' },
  { id:7,  company:'Integers',     name:'Deepak Joshi',    email:'d.joshi@enterprise.co',   phone:'9222333444', source:'Referral',  date:'2026-05-05', status:'Contacted',   notes:'' },
  { id:8,  company:'Consumer',     name:'Meera Iyer',      email:'meera@cosmeticbrand.in',  phone:'9555666777', source:'Website',   date:'2026-05-06', status:'Closed Lost', notes:'Budget constraints' },
]

let _kpis = [
  // Department KPIs — one per dept
  { id:1, type:'dept', departmentId:1, goal:'Digital & Web — 500+ Organic Leads/Month',     metric:'Total organic leads from SEO & web channels',      timeline:'Monthly',   target:500,  current:312, unit:'leads', status:'On Track', assignedTo:null,            parentId:null, createdBy:'Nikhil Raut' },
  { id:2, type:'dept', departmentId:2, goal:'Performance Mktg — 75%+ Campaign ROI',         metric:'Average ROI across all paid campaigns',             timeline:'Monthly',   target:75,   current:68,  unit:'%',     status:'At Risk',  assignedTo:null,            parentId:null, createdBy:'Nikhil Raut' },
  { id:3, type:'dept', departmentId:3, goal:'Growth & Automation — 100 LinkedIn Leads/Mo',  metric:'Leads from LinkedIn outreach & automation',         timeline:'Monthly',   target:100,  current:55,  unit:'leads', status:'On Track', assignedTo:null,            parentId:null, createdBy:'Nikhil Raut' },
  // Personal KPIs (type:'user')
  { id:4, type:'user', departmentId:1, goal:'Virendra — 200 Web Leads',                     metric:'Leads from web & SEO channels',                     timeline:'Monthly',   target:200,  current:145, unit:'leads', status:'On Track', assignedTo:'Virendra Kini', parentId:1,    createdBy:'Nikhil Raut' },
  { id:5, type:'user', departmentId:2, goal:'Devendra — 150 Email Leads',                   metric:'Leads from email campaigns',                        timeline:'Monthly',   target:150,  current:98,  unit:'leads', status:'At Risk',  assignedTo:'Devendra R',    parentId:2,    createdBy:'Omkar B' },
  { id:6, type:'user', departmentId:1, goal:'Aishwarya — IG 3% Engagement Rate',            metric:'Average Instagram post engagement rate',            timeline:'Monthly',   target:3,    current:2.4, unit:'%',     status:'At Risk',  assignedTo:'Aishwarya S',   parentId:1,    createdBy:'Virendra Kini' },
  { id:7, type:'user', departmentId:2, goal:'Omkar — 5 Analysis Reports/Month',             metric:'Monthly competitor analysis reports delivered',     timeline:'Monthly',   target:5,    current:3,   unit:'reports',status:'On Track', assignedTo:'Omkar B',       parentId:2,    createdBy:'Omkar B' },
  { id:8, type:'user', departmentId:3, goal:'Amarjit — 100 LinkedIn Leads',                 metric:'Leads from LinkedIn outreach & content',            timeline:'Monthly',   target:100,  current:55,  unit:'leads', status:'On Track', assignedTo:'Amarjit Gupta', parentId:3,    createdBy:'Yukta Moolya' },
]

let _activity = [
  { id:1,  user:'Nikhil Raut',    role:'admin',   action:'login',        detail:'Admin signed in',                                ts: new Date(Date.now()-3600000).toISOString() },
  { id:2,  user:'Virendra Kini',  role:'lead',    action:'task-updated', detail:'Updated: SEO audit & keyword strategy Q2',      ts: new Date(Date.now()-7200000).toISOString() },
  { id:3,  user:'Aishwarya S',    role:'user',    action:'progress',     detail:'Progress 25%→40% on Instagram reels content',   ts: new Date(Date.now()-10800000).toISOString() },
  { id:4,  user:'Nikhil Raut',    role:'admin',   action:'lead-created', detail:'New lead: Kavya Nair (Umang Global)',           ts: new Date(Date.now()-14400000).toISOString() },
  { id:5,  user:'Sagar Devlekar', role:'manager', action:'task-created', detail:'Created: Google Ads May budget planning',       ts: new Date(Date.now()-18000000).toISOString() },
  { id:6,  user:'Omkar B',        role:'user',    action:'progress',     detail:'Progress 60%→80% on Competitor analysis report',ts: new Date(Date.now()-21600000).toISOString() },
  { id:7,  user:'Nikhil Raut',    role:'admin',   action:'kpi-updated',  detail:'KPI updated: +45 leads to Virendra Web KPI',   ts: new Date(Date.now()-25200000).toISOString() },
  { id:8,  user:'Devendra R',     role:'lead',    action:'task-created', detail:'Created: May email newsletter design',          ts: new Date(Date.now()-28800000).toISOString() },
]

// ── Daily Logs — one entry per user per day ───────────────────
const _today     = new Date().toISOString().split('T')[0]
const _yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
const _twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0]

let _dailyLogs = [
  // Today
  { id:1, userId:3, userName:'Virendra Kini',   departmentId:1, date:_today,     content:'Completed the SEO audit for 3 client websites. Identified 12 technical issues and documented them. Started the keyword mapping sheet for Q2 strategy. Reviewed content gaps for the organic traffic growth plan.', createdAt: new Date(Date.now()-3600000).toISOString(), updatedAt: new Date(Date.now()-3600000).toISOString() },
  { id:2, userId:4, userName:'Devendra R',       departmentId:2, date:_today,     content:'Designed and sent out the May email newsletter. Open rate looks good at 28%. Reviewed last week\'s ad performance data and prepared a quick summary for the team. Followed up with 3 pending client queries.', createdAt: new Date(Date.now()-7200000).toISOString(),  updatedAt: new Date(Date.now()-7200000).toISOString()  },
  { id:3, userId:7, userName:'Vinit Pandhre',    departmentId:1, date:_today,     content:'Fixed all CLS and LCP issues on the landing page after last week\'s speed audit. Pushed changes to staging. Tested across mobile and desktop browsers. Waiting for manager review before go-live.', createdAt: new Date(Date.now()-10800000).toISOString(), updatedAt: new Date(Date.now()-10800000).toISOString() },
  { id:4, userId:5, userName:'Yukta Moolya',     departmentId:3, date:_today,     content:'Set up the LinkedIn outreach automation sequence for Q2. Configured lead scoring rules and tested with 10 sample profiles. Connected with the growth team on content calendar for next week.', createdAt: new Date(Date.now()-14400000).toISOString(), updatedAt: new Date(Date.now()-14400000).toISOString() },
  // Yesterday
  { id:5, userId:3, userName:'Virendra Kini',   departmentId:1, date:_yesterday, content:'Attended the weekly SEO sync. Reviewed backlink profile for Client A — disavowed 8 spammy links. Updated the Google Search Console tracking for the new property.', createdAt: new Date(Date.now()-90000000).toISOString(),  updatedAt: new Date(Date.now()-90000000).toISOString()  },
  { id:6, userId:8, userName:'Aishwarya S',      departmentId:1, date:_yesterday, content:'Shot 4 Instagram reels and 6 static posts for the May calendar. Edited and scheduled all content in Meta Business Suite. Replied to 32 DMs and comments for client accounts.', createdAt: new Date(Date.now()-86400000).toISOString(), updatedAt: new Date(Date.now()-86400000).toISOString() },
  { id:7, userId:9, userName:'Sahil P',          departmentId:2, date:_yesterday, content:'Compiled the April campaign performance report. ROAS improved to 4.2x vs 3.6x last month. Sent draft to manager for review. Worked on budget planning for next month\'s campaigns.', createdAt: new Date(Date.now()-93600000).toISOString(), updatedAt: new Date(Date.now()-93600000).toISOString() },
  // Two days ago
  { id:8, userId:10, userName:'Neel Naik',        departmentId:3, date:_twoDaysAgo, content:'Planned 3 weeks of social content for Integers brand. Created graphics templates in Canva. Shared plan with team lead for approval. Started writing captions for week 1 posts.', createdAt: new Date(Date.now()-172800000).toISOString(), updatedAt: new Date(Date.now()-172800000).toISOString() },
  { id:9, userId:11, userName:'Amarjit Gupta',    departmentId:3, date:_twoDaysAgo, content:'Ran the LinkedIn lead scraping sequence. Got 28 new connection requests accepted. Sent 15 personalised messages. 4 replies received — 2 look promising. Updated the CRM with today\'s activity.', createdAt: new Date(Date.now()-176400000).toISOString(), updatedAt: new Date(Date.now()-176400000).toISOString() },
]

let _nextId = { users: 13, tasks: 17, leads: 9, kpis: 9, activity: 9, departments: 5, dailyLogs: 10 }

function addActivity(user, role, action, detail) {
  _activity.unshift({ id: _nextId.activity++, user, role, action, detail, ts: new Date().toISOString() })
}

function paginate(arr, params = {}) {
  const limit = Number(params.limit) || arr.length
  return arr.slice(0, limit)
}

function safe(u) {
  const { password, ...rest } = u
  return rest
}

// ── Mock handlers ────────────────────────────────────────────
export const mock = {

  // Auth
  async login(email, password) {
    await delay()
    const user = _users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
    if (!user) throw new Error('Invalid email or password.')
    return { access_token: `mock_token_${user.id}`, user: safe(user) }
  },

  async me(token) {
    await delay(60)
    const id = Number(token?.replace('mock_token_', ''))
    const user = _users.find(u => u.id === id)
    if (!user) throw new Error('Session expired.')
    return safe(user)
  },

  // Departments
  async listDepartments() {
    await delay()
    return _departments.filter(d => !d.isArchived)
  },

  async createDepartment(data) {
    await delay()
    const d = { id: _nextId.departments++, isArchived: false, ...data }
    _departments.push(d)
    return d
  },

  async updateDepartment(id, data) {
    await delay()
    const idx = _departments.findIndex(d => d.id === Number(id))
    if (idx === -1) throw new Error('Department not found.')
    _departments[idx] = { ..._departments[idx], ...data }
    return _departments[idx]
  },

  async removeDepartment(id) {
    await delay()
    // Archive instead of hard delete
    const idx = _departments.findIndex(d => d.id === Number(id))
    if (idx !== -1) _departments[idx].isArchived = true
    return null
  },

  // Categories — scoped per department
  async listCategories(params = {}) {
    await delay(60)
    const deptId = params.departmentId ? Number(params.departmentId) : null
    if (deptId) return [...(_categories[deptId] ?? [])]
    // No dept specified (admin): return all unique categories across all depts
    return [...new Set(Object.values(_categories).flat())].sort()
  },

  async createCategory(name, params = {}) {
    await delay()
    const deptId = params.departmentId ? Number(params.departmentId) : null
    if (!deptId) throw new Error('Department is required to create a category.')
    if (!_categories[deptId]) _categories[deptId] = []
    if (_categories[deptId].includes(name)) throw new Error('Category already exists in this department.')
    _categories[deptId].push(name)
    return [..._categories[deptId]]
  },

  async updateCategory(oldName, newName, params = {}) {
    await delay()
    const deptId = params.departmentId ? Number(params.departmentId) : null
    if (!deptId) throw new Error('Department is required to rename a category.')
    const cats = _categories[deptId] ?? []
    const idx = cats.indexOf(oldName)
    if (idx === -1) throw new Error('Category not found in this department.')
    _categories[deptId][idx] = newName
    // Update tasks in this department that used the old category name
    _tasks.forEach(t => { if (t.departmentId === deptId && t.category === oldName) t.category = newName })
    return [..._categories[deptId]]
  },

  async removeCategory(name, params = {}) {
    await delay()
    const deptId = params.departmentId ? Number(params.departmentId) : null
    if (!deptId) throw new Error('Department is required to remove a category.')
    _categories[deptId] = (_categories[deptId] ?? []).filter(c => c !== name)
    return [..._categories[deptId]]
  },

  // Users
  async listUsers(params = {}) {
    await delay()
    let list = _users.map(safe)
    if (params.departmentId) list = list.filter(u => u.departmentId === Number(params.departmentId))
    return list
  },

  async createUser(data) {
    await delay()
    const u = { id: _nextId.users++, status: 'Active', added: new Date().toISOString().slice(0,10), ...data }
    _users.push(u)
    return safe(u)
  },

  async updateUser(id, data) {
    await delay()
    const idx = _users.findIndex(u => u.id === Number(id))
    if (idx === -1) throw new Error('User not found.')
    _users[idx] = { ..._users[idx], ...data }
    return safe(_users[idx])
  },

  async removeUser(id) {
    await delay()
    _users = _users.filter(u => u.id !== Number(id))
    return null
  },

  async updateProfile(data, token) {
    await delay()
    const uid = Number(token?.replace('mock_token_', ''))
    const idx = _users.findIndex(u => u.id === uid)
    if (idx === -1) throw new Error('User not found.')
    _users[idx] = { ..._users[idx], ...data }
    return safe(_users[idx])
  },

  // Tasks
  async listTasks(params = {}) {
    await delay()
    let list = [..._tasks]
    if (params.departmentId) list = list.filter(t => t.departmentId === Number(params.departmentId))
    if (params.assigned_to)  list = list.filter(t => t.assignedTo === params.assigned_to)
    if (params.status)       list = list.filter(t => t.status === params.status)
    if (params.clientType)   list = list.filter(t => (t.clientType ?? []).includes(params.clientType))
    return list
  },

  async createTask(data) {
    await delay()
    const t = { id: _nextId.tasks++, delegationChain: [], kpiId: null, progress: 0, clientType: ['B2B'], ...data }
    _tasks.push(t)
    addActivity(data.createdBy || 'Unknown', 'user', 'task-created', `Created: ${data.description}`)
    return t
  },

  async updateTask(id, data) {
    await delay()
    const idx = _tasks.findIndex(t => t.id === Number(id))
    if (idx === -1) throw new Error('Task not found.')
    _tasks[idx] = { ..._tasks[idx], ...data }
    addActivity(data.updatedBy || 'Unknown', 'user', 'task-updated', `Updated: ${_tasks[idx].description}`)
    return _tasks[idx]
  },

  async removeTask(id) {
    await delay()
    const t = _tasks.find(t => t.id === Number(id))
    _tasks = _tasks.filter(t => t.id !== Number(id))
    if (t) addActivity('Admin', 'admin', 'task-deleted', `Deleted: ${t.description}`)
    return null
  },

  async taskProgress(id, data) {
    await delay()
    const idx = _tasks.findIndex(t => t.id === Number(id))
    if (idx === -1) throw new Error('Task not found.')
    _tasks[idx].progress = data.progress ?? _tasks[idx].progress
    if (data.status) _tasks[idx].status = data.status
    addActivity(data.updatedBy || 'Unknown', 'user', 'progress', `Progress ${data.progress}% on ${_tasks[idx].description}`)
    return _tasks[idx]
  },

  async submitTask(id, data) {
    // User submits task for manager approval
    await delay()
    const idx = _tasks.findIndex(t => t.id === Number(id))
    if (idx === -1) throw new Error('Task not found.')
    const now = new Date().toISOString()
    _tasks[idx].status      = 'Pending Approval'
    _tasks[idx].progress    = 100
    _tasks[idx].submittedAt = now
    _tasks[idx].submittedBy = data.submittedBy || 'Unknown'
    addActivity(data.submittedBy || 'Unknown', 'user', 'task-submitted', `Submitted for approval: ${_tasks[idx].description}`)
    return _tasks[idx]
  },

  async approveTask(id, data) {
    // Manager/Admin approves task completion
    await delay()
    const idx = _tasks.findIndex(t => t.id === Number(id))
    if (idx === -1) throw new Error('Task not found.')
    const now = new Date().toISOString()
    _tasks[idx].status     = 'Completed'
    _tasks[idx].approvedAt = now
    _tasks[idx].approvedBy = data.approvedBy || 'Unknown'
    addActivity(data.approvedBy || 'Unknown', 'manager', 'task-approved', `Approved completion: ${_tasks[idx].description}`)
    return _tasks[idx]
  },

  async weeklyReport(params = {}) {
    await delay()
    const today     = new Date().toISOString().split('T')[0]
    const sevenAgo  = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const dateFrom  = params.dateFrom || sevenAgo
    const dateTo    = params.dateTo   || today

    let tasks = [..._tasks]
    if (params.departmentId) tasks = tasks.filter(t => t.departmentId === Number(params.departmentId))

    // Group by assignee
    const byUser = {}
    tasks.forEach(task => {
      const key = task.assignedTo
      if (!key) return
      if (!byUser[key]) {
        const user = _users.find(u => u.name === key)
        byUser[key] = {
          userName:     key,
          departmentId: task.departmentId,
          role:         user?.role ?? 'user',
          tasks:        [],
        }
      }
      byUser[key].tasks.push(task)
    })

    return Object.values(byUser).map(({ userName, departmentId, role, tasks: ut }) => {
      const isOver = t => t.dueDate && t.dueDate < today && t.status !== 'Completed' && t.status !== 'Pending Approval'
      return {
        userName,
        departmentId,
        role,
        total:           ut.length,
        completed:       ut.filter(t => t.status === 'Completed').length,
        pendingApproval: ut.filter(t => t.status === 'Pending Approval').length,
        inProgress:      ut.filter(t => t.status === 'In Progress').length,
        review:          ut.filter(t => t.status === 'Review').length,
        blocker:         ut.filter(t => t.status === 'Blocker').length,
        notStarted:      ut.filter(t => t.status === 'Not Started').length,
        overdue:         ut.filter(t => isOver(t)).length,
        completedTasks: ut
          .filter(t => t.status === 'Completed' || t.status === 'Pending Approval')
          .map(t => ({
            id:          t.id,
            description: t.description,
            category:    t.category,
            dueDate:     t.dueDate,
            submittedAt: t.submittedAt,
            submittedBy: t.submittedBy,
            approvedAt:  t.approvedAt,
            approvedBy:  t.approvedBy,
            status:      t.status,
          })),
      }
    }).sort((a, b) => b.completed - a.completed)
  },

  async delegateTask(id, data) {
    await delay()
    const idx = _tasks.findIndex(t => t.id === Number(id))
    if (idx === -1) throw new Error('Task not found.')
    const from = _tasks[idx].assignedTo
    _tasks[idx].assignedTo = data.delegate_to
    _tasks[idx].delegationChain = [
      ...(_tasks[idx].delegationChain ?? []),
      { from, to: data.delegate_to, note: data.note || '', at: new Date().toISOString() },
    ]
    addActivity(from, 'user', 'task-delegated', `Delegated "${_tasks[idx].description}" to ${data.delegate_to}`)
    return _tasks[idx]
  },

  // KPIs — scoped by department
  async listKpis(params = {}) {
    await delay()
    let list = [..._kpis]
    if (params.departmentId) {
      list = list.filter(k => k.departmentId === Number(params.departmentId))
    }
    if (params.type) {
      list = list.filter(k => k.type === params.type)
    }
    return list
  },

  async createKpi(data) {
    await delay()
    const k = { id: _nextId.kpis++, ...data }
    _kpis.push(k)
    return k
  },

  async updateKpi(id, data) {
    await delay()
    const idx = _kpis.findIndex(k => k.id === Number(id))
    if (idx === -1) throw new Error('KPI not found.')
    _kpis[idx] = { ..._kpis[idx], ...data }
    return _kpis[idx]
  },

  async removeKpi(id) {
    await delay()
    _kpis = _kpis.filter(k => k.id !== Number(id))
    return null
  },

  async kpiAddValue(id, data) {
    await delay()
    const idx = _kpis.findIndex(k => k.id === Number(id))
    if (idx === -1) throw new Error('KPI not found.')
    _kpis[idx].current = (_kpis[idx].current || 0) + (data.add_value || 0)
    const pct = _kpis[idx].target > 0 ? (_kpis[idx].current / _kpis[idx].target) * 100 : 0
    if (pct >= 100) _kpis[idx].status = 'Achieved'
    else if (pct >= 75) _kpis[idx].status = 'On Track'
    else if (pct >= 50) _kpis[idx].status = 'At Risk'
    else _kpis[idx].status = 'Behind'
    addActivity('User', 'user', 'kpi-updated', `Added ${data.add_value} ${_kpis[idx].unit} to "${_kpis[idx].goal}"`)
    return _kpis[idx]
  },

  // Leads
  async listLeads(params = {}) {
    await delay()
    let list = [..._leads]
    if (params.company) list = list.filter(l => l.company === params.company)
    return list
  },

  async createLead(data) {
    await delay()
    const l = { id: _nextId.leads++, ...data }
    _leads.push(l)
    addActivity('User', 'user', 'lead-created', `New lead: ${data.name} (${data.company})`)
    return l
  },

  async updateLead(id, data) {
    await delay()
    const idx = _leads.findIndex(l => l.id === Number(id))
    if (idx === -1) throw new Error('Lead not found.')
    _leads[idx] = { ..._leads[idx], ...data }
    return _leads[idx]
  },

  async removeLead(id) {
    await delay()
    const l = _leads.find(l => l.id === Number(id))
    _leads = _leads.filter(l => l.id !== Number(id))
    if (l) addActivity('Admin', 'admin', 'lead-deleted', `Deleted lead: ${l.name}`)
    return null
  },

  // Activity
  async listActivity(params = {}) {
    await delay()
    return paginate(_activity, params)
  },

  async mineActivity(token, params = {}) {
    await delay()
    const id = Number(token?.replace('mock_token_', ''))
    const user = _users.find(u => u.id === id)
    if (!user) return []
    const mine = _activity.filter(a => a.user === user.name)
    return paginate(mine, params)
  },

  // Dashboard
  async dashboardStats(params = {}) {
    await delay()
    let list = params.departmentId
      ? _tasks.filter(t => t.departmentId === Number(params.departmentId))
      : _tasks
    const total     = list.length
    const completed = list.filter(t => t.status === 'Completed').length
    const inProg    = list.filter(t => t.status === 'In Progress').length
    const blockers  = list.filter(t => t.status === 'Blocker').length
    const now       = new Date()
    const overdue   = list.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed').length
    const rate      = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total_tasks: total, completed, in_progress: inProg, blockers, overdue, completion_rate: rate }
  },

  async dashboardWeekly(params = {}) {
    await delay()
    let list = params.departmentId
      ? _tasks.filter(t => t.departmentId === Number(params.departmentId))
      : _tasks
    const map = {}
    list.forEach(t => {
      const w = t.week ?? 0
      if (!map[w]) map[w] = { week: w, total: 0, completed: 0 }
      map[w].total++
      if (t.status === 'Completed') map[w].completed++
    })
    return Object.values(map).sort((a, b) => a.week - b.week)
  },

  async dashboardLeadsBySource(params = {}) {
    await delay()
    let list = params.company ? _leads.filter(l => l.company === params.company) : _leads
    const map = {}
    list.forEach(l => {
      if (!map[l.source]) map[l.source] = { source: l.source, count: 0 }
      map[l.source].count++
    })
    return Object.values(map).sort((a, b) => b.count - a.count)
  },

  async dashboardDailyLeads(params = {}) {
    await delay(80)
    const today = new Date()
    const days = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const real = _leads.filter(l => l.date === key && (!params.company || l.company === params.company)).length
      const synthetic = real + Math.floor(Math.sin(i * 1.3) * 2 + 2)
      days.push({ date: key, count: Math.max(0, synthetic) })
    }
    return days
  },

  // Daily Logs
  async listDailyLogs(params = {}) {
    await delay()
    let list = [..._dailyLogs]
    if (params.departmentId) list = list.filter(l => l.departmentId === Number(params.departmentId))
    if (params.userId)       list = list.filter(l => l.userId === Number(params.userId))
    if (params.dateFrom)     list = list.filter(l => l.date >= params.dateFrom)
    if (params.dateTo)       list = list.filter(l => l.date <= params.dateTo)
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  },

  async createDailyLog(data) {
    await delay()
    const token = localStorage.getItem('itms_token')
    const uid   = Number(token?.replace('mock_token_', ''))
    const user  = _users.find(u => u.id === uid)
    if (!user) throw new Error('Not authenticated.')
    // Prevent duplicate on same date
    const exists = _dailyLogs.find(l => l.userId === uid && l.date === data.date)
    if (exists) throw new Error('You already have a log for today. Update the existing entry instead.')
    const now = new Date().toISOString()
    const log = {
      id: _nextId.dailyLogs++,
      userId: uid,
      userName: user.name,
      departmentId: user.departmentId,
      date: data.date,
      content: data.content,
      createdAt: now,
      updatedAt: now,
    }
    _dailyLogs.push(log)
    return log
  },

  async updateDailyLog(id, data) {
    await delay()
    const idx = _dailyLogs.findIndex(l => l.id === Number(id))
    if (idx === -1) throw new Error('Log entry not found.')
    _dailyLogs[idx] = { ..._dailyLogs[idx], content: data.content, updatedAt: new Date().toISOString() }
    return _dailyLogs[idx]
  },

  async removeDailyLog(id) {
    await delay()
    _dailyLogs = _dailyLogs.filter(l => l.id !== Number(id))
    return null
  },
}
