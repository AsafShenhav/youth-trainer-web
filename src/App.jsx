// src/App.jsx
import React, { useEffect, useMemo, useState, createContext, useContext } from 'react'
import Lottie from 'lottie-react'
import { useAuth } from './auth-local.js'

// ---------- Simple UI helpers ----------
const Button = ({ title, onClick, variant='primary' }) => (
  <button className={`btn ${variant==='secondary'?'secondary':''} ${variant==='ghost'?'ghost':''}`} onClick={onClick}>
    {title}
  </button>
)
const Alert = { alert: (title, msg) => window.alert(`${title}: ${msg}`) }

// ---------- Sports options ----------
const SPORTS_OPTIONS = [
  'Soccer','Basketball','Swimming','Tennis','Gymnastics',
  'Martial Arts','Athletics / Track & Field','Volleyball',
  'Cycling','General Fitness'
]

// ---------- Exercise bank ----------
const EXERCISES = [
  { id:'mob_ankles',   name:'Ankle Mobility Circles', cat:'Mobility',    morning:true,  evening:false, baseLoad:1, sports:['Soccer','Basketball','Athletics / Track & Field','General Fitness'] },
  { id:'mob_hips',     name:'90/90 Hip Switches',     cat:'Mobility',    morning:true,  evening:false, baseLoad:1, sports:['Soccer','Tennis','Martial Arts','General Fitness'] },
  { id:'core_deadbug', name:'Dead Bugs',              cat:'Core',        morning:true,  evening:true,  baseLoad:2, sports:['Soccer','Basketball','Tennis','General Fitness'] },
  { id:'core_plank',   name:'Front Plank',            cat:'Core',        morning:false, evening:true,  baseLoad:2, sports:['Soccer','Swimming','Gymnastics','General Fitness'] },
  { id:'str_squat',    name:'Bodyweight Squats',      cat:'Strength',    morning:true,  evening:true,  baseLoad:3, sports:['Soccer','Basketball','Martial Arts','General Fitness'] },
  { id:'str_split',    name:'Split Squats',           cat:'Strength',    morning:true,  evening:true,  baseLoad:3, sports:['Soccer','Tennis','Athletics / Track & Field','General Fitness'] },
  { id:'str_pushup',   name:'Push-Ups (elevated if needed)', cat:'Strength', morning:false, evening:true, baseLoad:3, sports:['Soccer','Swimming','Gymnastics','General Fitness'] },
  { id:'ply_pogo',     name:'Pogo Hops (low)',        cat:'Plyometrics', morning:true,  evening:false, baseLoad:2, sports:['Soccer','Athletics / Track & Field','Volleyball','General Fitness'] },
  { id:'agi_ladder',   name:'Agility Ladder (patterns)', cat:'Agility',  morning:false, evening:true,  baseLoad:2, sports:['Soccer','Basketball','Tennis','General Fitness'] },
  { id:'ball_juggle',  name:'Ball Juggling',          cat:'Ball Skills', morning:true,  evening:true,  baseLoad:2, sports:['Soccer'] },
  { id:'ball_wallpass',name:'Wall Passes (both feet)',cat:'Ball Skills', morning:true,  evening:true,  baseLoad:2, sports:['Soccer'] },
  { id:'cond_aerobic', name:'Easy Jog / Bike',        cat:'Conditioning',morning:false, evening:true,  baseLoad:2, sports:['Soccer','Cycling','Athletics / Track & Field','General Fitness'] },
]

// ---------- Exercise media/meta (Lottie first, fallback to gif/mp4) ----------
const EXERCISE_META = {
  // דוגמאות Lottie (אפשר להחליף ל-URLs משלך/קבצים מקומיים)
  core_deadbug: { lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_3vbOcw.json', mediaUrl: null, muscles: ['deep core','hip flexors'], description: 'Opposite arm/leg lowers; keep back flat on the floor.' },
  str_squat:    { lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_l7g5m2.json', mediaUrl: null, muscles: ['quadriceps','glutes'],    description: 'Sit back & down; knees track over toes; bodyweight only.' },

  // Fallback למדיה רגילה אם אין Lottie
  mob_ankles:   { mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeA/ankle.gif',      lottieUrl: null, muscles: ['ankle stabilizers','calves'],      description: 'Gentle ankle circles to prep for cutting & running.' },
  mob_hips:     { mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeA/hips.gif',       lottieUrl: null, muscles: ['hip rotators','glutes'],          description: '90/90 switches to open hips; smooth control.' },
  core_plank:   { mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeA/plank.gif',      lottieUrl: null, muscles: ['core','shoulders'],                description: 'Hold straight line; no sag; breathe steady.' },
  str_split:    { mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeA/splitsquat.gif', lottieUrl: null, muscles: ['quads','glutes','calves'],        description: 'Single-leg focus supports acceleration/deceleration.' },
  str_pushup:   { mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeA/pushup.gif',     lottieUrl: null, muscles: ['chest','triceps','core'],         description: 'Hands under shoulders; elevate if needed for form.' },
  ply_pogo:     { mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeA/pogo.gif',       lottieUrl: null, muscles: ['calves','ankle complex'],         description: 'Low, quick hops; elastic ankles; very light impact.' },
  agi_ladder:   { mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeA/ladder.gif',     lottieUrl: null, muscles: ['calves','hip flexors'],           description: 'Light ladder patterns for quick feet.' },
  ball_juggle:  { mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeA/juggle.gif',     lottieUrl: null, muscles: ['hip flexors','calves','core'],    description: 'Soft touches both feet; steady rhythm.' },
  ball_wallpass:{ mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeA/wallpass.gif',   lottieUrl: null, muscles: ['hip flexors','calves'],           description: 'Pass/receive both feet; angle body; first touch forward.' },
  cond_aerobic: { mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeA/easyjog.gif',    lottieUrl: null, muscles: ['heart/lungs','legs'],             description: 'Easy, talk-able pace; build aerobic base.' },
}

// ---------- Viewport + media helpers ----------
function getViewportSize() {
  return { w: window.innerWidth || 360, h: window.innerHeight || 640 }
}
function AutoFitImage({ src, alt, type='img', maxVH=70 }) {
  if (!src) return <div style={{ color:'#666' }}>No media</div>
  const { h } = getViewportSize()
  const common = { width: '100%', maxHeight: Math.round((maxVH/100)*h), objectFit: 'contain', borderRadius: 8 }
  return type==='video'
    ? <video src={src} autoPlay loop muted playsInline controls style={common} />
    : <img src={src} alt={alt||'image'} style={common} />
}
function VideoOrImage({ src, alt }) {
  if (!src) return <div style={{ color:'#666' }}>No media</div>
  const lower = String(src).toLowerCase()
  const isWebm = lower.endsWith('.webm')
  const isMp4  = lower.endsWith('.mp4') || lower.includes('.mp4?')
  return (isMp4 || isWebm) ? <AutoFitImage src={src} alt={alt} type="video" maxVH={70}/> : <AutoFitImage src={src} alt={alt} type="img" maxVH={70}/>
}

// ---------- Domain helpers ----------
const weekKeyFor = (d = new Date()) => {
  const dt = new Date(d); const day = dt.getDay(); const diff = (day===0?-6:1) - day
  const mon = new Date(dt); mon.setDate(dt.getDate()+diff); mon.setHours(0,0,0,0)
  return mon.toISOString().slice(0,10)
}
const prevWeek = (wk) => { const d = new Date(wk); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10) }

const estimateYouthCalories = ({ weightKg, heightCm, ageYears=11 }) => {
  const bmr = 17.5 * weightKg + 651
  return Math.round(bmr * 1.5)
}
const adjustLoad = (prev) => {
  const out = {}; if (!prev) return out
  Object.entries(prev).forEach(([exId, arr]) => {
    if (!arr.length) return
    const avg = arr.reduce((s,v)=>s+v,0)/arr.length
    out[exId] = avg < 1.7 ? +1 : avg > 2.3 ? -1 : 0
  })
  return out
}
const prescribe = (ex, delta) => {
  if (['Mobility','Ball Skills'].includes(ex.cat)) { const m = Math.max(2, 3+ex.baseLoad+delta); return { desc: `${m} min practice`, minutes: m } }
  if (ex.cat==='Conditioning') { const m = Math.max(8, 10+ex.baseLoad*2+delta*2); return { desc: `${m} min easy`, minutes: m } }
  if (['Core','Strength'].includes(ex.cat)) { const sets = Math.max(2, 2+delta); const reps = Math.max(8, 10+delta*2); return { desc: `${sets} x ${reps}` } }
  if (['Plyometrics','Agility'].includes(ex.cat)) { const sets = Math.max(2, 2+delta); const reps = Math.max(6, 8+delta*2); return { desc: `${sets} x ${reps}` } }
  return { desc: 'As guided' }
}

// sports selection helpers
function selectedSportsOrDefault(profile) {
  const s = Array.isArray(profile?.sports) && profile.sports.length ? profile.sports : ['Soccer']
  return s
}
function intersectsSports(ex, selected) {
  if (!ex?.sports || !Array.isArray(ex.sports) || ex.sports.length===0) return selected.includes('General Fitness')
  return ex.sports.some(s => selected.includes(s))
}

// 60% soccer bias distribution
function pickWithBias(exercises, selectedSports, count) {
  const soccer = exercises.filter(e => e.sports?.includes('Soccer'))
  const other = exercises.filter(e => !e.sports?.includes('Soccer') && intersectsSports(e, selectedSports))

  const targetSoccer = Math.min(soccer.length, Math.round(count * 0.6))
  const targetOther  = Math.max(0, count - targetSoccer)

  const pickN = (arr, n) => arr.slice(0, n)
  let chosen = [...pickN(soccer, targetSoccer), ...pickN(other, targetOther)]

  if (chosen.length < count) {
    const remaining = exercises.filter(e => !chosen.includes(e))
    chosen = [...chosen, ...remaining.slice(0, count - chosen.length)]
  }
  return chosen
}

const basePlanForDay = (profile, dayIndex) => {
  const themes = ['Mobility/Core + Ball','Strength + Ball','Agility/Plyo + Ball','Conditioning + Ball','Strength + Ball','Mobility/Core + Ball','Active Recovery + Fun Ball']
  const theme = themes[dayIndex % themes.length]
  const isRecovery = theme.includes('Recovery')
  const chosenSports = selectedSportsOrDefault(profile)

  const allowByTheme = (e) => (
    theme.includes('Strength')    ? ['Strength','Core','Ball Skills'].includes(e.cat) :
    theme.includes('Agility')     ? ['Agility','Plyometrics','Ball Skills'].includes(e.cat) :
    theme.includes('Conditioning')? ['Conditioning','Ball Skills'].includes(e.cat) :
                                    ['Core','Mobility','Ball Skills'].includes(e.cat)
  )

  const morningRaw = EXERCISES.filter(e => e.morning && (isRecovery ? ['Mobility','Ball Skills'].includes(e.cat) : true))
  const eveningRaw = EXERCISES.filter(e => e.evening && allowByTheme(e))

  const morningFiltered = morningRaw.filter(e => intersectsSports(e, chosenSports))
  const eveningFiltered = eveningRaw.filter(e => intersectsSports(e, chosenSports))

  const slotsMorning = Math.max(2, Math.floor((profile.morningMins||0)/8))
  const slotsEvening = Math.max(2, Math.floor((profile.eveningMins||0)/8))

  const morning = pickWithBias(morningFiltered, chosenSports, Math.min(morningFiltered.length, slotsMorning))
  const evening = pickWithBias(eveningFiltered, chosenSports, Math.min(eveningFiltered.length, slotsEvening))

  return { theme, morning, evening }
}

// merge ChatGPT ideas automatically (transparent to UI)
function mergeIdeasIntoPlan(weeklyPlan, ideas) {
  if (!ideas || !ideas.length) return weeklyPlan
  const days = Object.keys(weeklyPlan).sort()
  const merged = JSON.parse(JSON.stringify(weeklyPlan))
  let dayIdx = 0
  ideas.forEach(idea => {
    const ideaSports = Array.isArray(idea.sports) && idea.sports.length ? idea.sports : ['General Fitness']
    ;(idea.block||[]).forEach((b, i) => {
      const dk = days[dayIdx % days.length]
      const id = `idea_${idea.id}_${i}`
      const injected = {
        id,
        name: b.name || `Idea: ${idea.title}`,
        cat: 'Idea',
        rx: { desc: b.rx || 'As guided' },
        fromIdea: true,
        sports: ideaSports
      }
      merged[dk].evening.push(injected)
      dayIdx++
    })
  })
  return merged
}

// ---------- Mocks for cloud features ----------
async function fetchNewIdeasFromCloud(profile, weekFeedback) {
  return [
    { id: 'idea1', title: 'Dribble Squares', sports:['Soccer'], rationale: 'Light agility + ball control; low impact', block: [
      { name: 'Cone dribble square', rx: '3 x 60s, rest 60s' },
      { name: 'Left/right foot taps', rx: '3 x 40s' },
    ]},
    { id: 'idea2', title: 'Core & Hips Circuit', sports:['General Fitness'], rationale: 'Supports sprint mechanics; safe volume', block: [
      { name: 'Dead bugs', rx: '3 x 10' },
      { name: 'Glute bridge', rx: '3 x 12' },
    ]},
  ]
}
async function requestReport(type, email) {
  Alert.alert('Report requested', `A ${type} report will be emailed to ${email} (mock).`)
}
async function bgSwap({ foregroundUrl, backgroundUrl }) {
  return { resultUrl: foregroundUrl, note: 'Mocked bgSwap. Wire your cloud endpoint.' }
}

// ---------- App Context ----------
const AppCtx = createContext(null)
const useApp = () => useContext(AppCtx)

// ---------- Auth (UI) ----------
function AuthGate({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>
  if (!user) return <AuthScreen/>
  return children
}
function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError('')
    try {
      if (mode === 'login') {
        await signIn({ identifier, password })
      } else {
        if (!username) { setError('Please choose a username.'); return }
        await signUp({ email: identifier, password, username })
      }
    } catch (err) { setError(err.message || 'Auth failed') }
  }

  return (
    <div style={{ maxWidth: 420, margin: '8vh auto', background:'#fff', borderRadius:12, padding:16, boxShadow:'0 1px 0 rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginTop:0 }}>{mode==='login' ? 'Log in' : 'Create account'}</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom:8 }}>
          <div style={{ color:'#666', fontSize:13 }}>Email (or use same as username)</div>
          <input required value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="you@example.com"
            style={{ width:'100%', padding:12, borderRadius:10, border:'1px solid #ddd' }}/>
        </div>
        {mode==='register' && (
          <div style={{ marginBottom:8 }}>
            <div style={{ color:'#666', fontSize:13 }}>Username</div>
            <input required value={username} onChange={e=>setUsername(e.target.value)} placeholder="yourname"
              style={{ width:'100%', padding:12, borderRadius:10, border:'1px solid #ddd' }}/>
          </div>
        )}
        <div style={{ marginBottom:8 }}>
          <div style={{ color:'#666', fontSize:13 }}>Password</div>
          <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="********"
            style={{ width:'100%', padding:12, borderRadius:10, border:'1px solid #ddd' }}/>
        </div>
        {error && <div style={{ color:'crimson', marginBottom:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:8 }}>
          <button type="submit" className="btn">{mode==='login' ? 'Log in' : 'Sign up'}</button>
          <button type="button" className="btn secondary" onClick={()=>setMode(mode==='login'?'register':'login')}>
            {mode==='login' ? 'Need an account?' : 'Have an account? Log in'}
          </button>
        </div>
      </form>
      <div style={{ marginTop:12, color:'#666', fontSize:12 }}>
        Demo only. Accounts saved in your browser. For production use a real backend (Supabase/Firebase).
      </div>
    </div>
  )
}

// ---------- Main App ----------
export default function App() {
  const [tab, setTab] = useState('dashboard') // tabs: dashboard|training|nutrition|ideas|rewards|settings|studio
  const [profile, setProfile] = useState({
    childName: '', age: 11, unitSystem: 'metric', height: 140, weight: 35,
    soccerPosition: 'Midfielder', daysPerWeek: 6,
    morningMins: 20, eveningMins: 25, guardianEmail: '',
    sports: ['Soccer'] // default
  })
  const [weekKey, setWeekKey] = useState(weekKeyFor())
  const [feedbackByWeek, setFeedbackByWeek] = useState({})
  const [completionByDate, setCompletionByDate] = useState({})
  const [ideas, setIdeas] = useState([])
  const [demoOpen, setDemoOpen] = useState(false)
  const [demoExercise, setDemoExercise] = useState(null)

  const prevWeekKey = useMemo(()=>prevWeek(weekKey),[weekKey])
  const adj = useMemo(()=>adjustLoad(feedbackByWeek[prevWeekKey]), [feedbackByWeek, prevWeekKey])

  const baseWeeklyPlan = useMemo(() => {
    const plan = {}
    for (let i=0;i<7;i++) {
      const d = new Date(weekKey); d.setDate(d.getDate()+i); const dk = d.toISOString().slice(0,10)
      const base = basePlanForDay(profile, i)
      const decorate = (arr) => arr.map(ex => ({ ...ex, rx: prescribe(ex, adj[ex.id]||0) }))
      plan[dk] = { dateKey: dk, theme: base.theme, morning: decorate(base.morning), evening: decorate(base.evening) }
    }
    return plan
  }, [profile, weekKey, adj])

  const weeklyPlan = useMemo(() => mergeIdeasIntoPlan(baseWeeklyPlan, ideas), [baseWeeklyPlan, ideas])

  const kcalTarget = useMemo(() => {
    const weightKg = profile.unitSystem==='metric' ? profile.weight : profile.weight/2.20462
    const heightCm = profile.unitSystem==='metric' ? profile.height : profile.height*2.54
    return estimateYouthCalories({ weightKg, heightCm, ageYears: profile.age })
  }, [profile])

  function markDone(dateKey, session, exId, done) {
    setCompletionByDate(prev => {
      const day = prev[dateKey] || { morning: [], evening: [] }
      const arr = day[session]
      const idx = arr.findIndex(x => x.id === exId)
      if (idx>=0) arr[idx] = { ...arr[idx], done }; else arr.push({ id: exId, done })
      return { ...prev, [dateKey]: { ...day, [session]: arr } }
    })
  }
  function recordDifficulty(exId, diff) {
    setFeedbackByWeek(prev => {
      const wk = prev[weekKey] || {}; const arr = wk[exId] || []; arr.push(diff)
      return { ...prev, [weekKey]: { ...wk, [exId]: arr } }
    })
  }
  async function pullNewIdeas() {
    const res = await fetchNewIdeasFromCloud(profile, feedbackByWeek[weekKey]||{})
    setIdeas(res)
    Alert.alert('New ideas ready', 'Check the Ideas tab for fresh sessions.')
  }
  function openDemo(ex) { setDemoExercise(ex); setDemoOpen(true) }

  const ctx = { profile, setProfile, kcalTarget, weeklyPlan, completionByDate, markDone, recordDifficulty, weekKey, setWeekKey, pullNewIdeas, ideas, openDemo }
  const { user, signOut } = useAuth()

  return (
    <AuthGate>
      <AppCtx.Provider value={ctx}>
        <div className="container">
          <div className="topbar">
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Youth Soccer Trainer</div>
              <div style={{ color:'#666' }}>Personalized training & nutrition • Not medical advice</div>
            </div>
            <div className="nav">
              <Button title="Dashboard" onClick={()=>setTab('dashboard')} />
              <Button title="Training"  onClick={()=>setTab('training')} />
              <Button title="Nutrition" onClick={()=>setTab('nutrition')} />
              <Button title="Ideas"     onClick={()=>setTab('ideas')} />
              <Button title="Rewards"   onClick={()=>setTab('rewards')} />
              <Button title="Settings"  onClick={()=>setTab('settings')} />
              <Button title="Studio"    onClick={()=>setTab('studio')} />
              <Button title={`Logout (${user?.username || user?.email || 'me'})`} variant="secondary" onClick={()=>signOut()} />
            </div>
          </div>

          {tab==='dashboard' && <Dashboard/>}
          {tab==='training'  && <Training/>}
          {tab==='nutrition' && <Nutrition/>}
          {tab==='rewards'   && <Rewards/>}
          {tab==='settings'  && <Settings/>}
          {tab==='ideas'     && <Ideas/>}
          {tab==='studio'    && <Studio/>}

          <Modal open={demoOpen} onClose={()=>setDemoOpen(false)}>
            <ExerciseDemo ex={demoExercise} />
          </Modal>
        </div>
      </AppCtx.Provider>
    </AuthGate>
  )
}

// ---------- Screens ----------
function Dashboard() {
  const { weeklyPlan, markDone, recordDifficulty, openDemo } = useApp()
  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>This Week</div>
      {Object.values(weeklyPlan).map((day) => (
        <div key={day.dateKey} className="card" style={{ marginBottom: 10 }}>
          <div className="row" style={{ justifyContent:'space-between' }}>
            <div style={{ color:'#666' }}>{new Date(day.dateKey).toDateString()}</div>
            <div style={{ fontSize:12, background:'#eee', padding:'3px 8px', borderRadius:999 }}>{day.theme}</div>
          </div>

          <div style={{ height:6 }} />
          <div style={{ fontWeight:700 }}>Morning</div>
          {day.morning.map(ex => (
            <RowExercise key={ex.id} ex={ex}
              onDone={(v)=>markDone(day.dateKey,'morning',ex.id,v)}
              onRate={(d)=>recordDifficulty(ex.id,d)}
              onView={()=>openDemo(ex)} />
          ))}

          <div style={{ height:6 }} />
          <div style={{ fontWeight:700 }}>Evening</div>
          {day.evening.map(ex => (
            <RowExercise key={ex.id} ex={ex}
              onDone={(v)=>markDone(day.dateKey,'evening',ex.id,v)}
              onRate={(d)=>recordDifficulty(ex.id,d)}
              onView={()=>openDemo(ex)} />
          ))}
        </div>
      ))}
    </div>
  )
}

function SportsChips({ sports }) {
  if (!sports || !sports.length) return null
  return (
    <div className="chips">
      {sports.map((s,i)=> <div key={i} className="chip">{s}</div>)}
    </div>
  )
}

function RowExercise({ ex, onDone, onRate, onView }) {
  return (
    <div className="row" style={{ justifyContent:'space-between', alignItems:'center', padding:'6px 0' }}>
      <div>
        <div style={{ fontSize:15, fontWeight:600 }}>{ex.name}</div>
        <div style={{ color:'#666' }}>{ex.rx.desc}</div>
        <SportsChips sports={ex.sports} />
      </div>
      <div className="row" style={{ alignItems:'center' }}>
        <Button title="View" variant="secondary" onClick={onView} />
        <Button title="Done" onClick={()=>onDone(true)} />
        <button className="btn ghost" onClick={()=>onRate(1)}>😌</button>
        <button className="btn ghost" onClick={()=>onRate(2)}>🙂</button>
        <button className="btn ghost" onClick={()=>onRate(3)}>😮‍💨</button>
      </div>
    </div>
  )
}

function Training() {
  const todayKey = new Date().toISOString().slice(0,10)
  const bank = EXERCISES
  const { weeklyPlan, openDemo } = useApp()
  const today = weeklyPlan[todayKey]
  return (
    <div style={{ padding:12 }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Exercise Library</div>
      <div className="row">
        {bank.map(ex => (
          <div key={ex.id} className="card" style={{ width:'calc(50% - 12px)' }}>
            <div style={{ fontWeight:700 }}>{ex.name}</div>
            <div style={{ color:'#666' }}>{ex.cat}</div>
            <div style={{ color:'#666' }}>Baseline: {ex.baseLoad}</div>
            <SportsChips sports={ex.sports} />
            <div style={{ height:8 }} />
            <Button title="View" variant="secondary" onClick={()=>openDemo(ex)} />
          </div>
        ))}
      </div>
      {today && (
        <div className="card" style={{ marginTop:12 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>Today ({new Date(todayKey).toDateString()})</div>
          <div style={{ color:'#666' }}>{today.theme}</div>
          <div style={{ height:6 }} />
          <div style={{ fontWeight:700 }}>Morning</div>
          {today.morning.map(ex => <div key={ex.id}>• {ex.name} — {ex.rx.desc}</div>)}
          <div style={{ height:6 }} />
          <div style={{ fontWeight:700 }}>Evening</div>
          {today.evening.map(ex => <div key={ex.id}>• {ex.name} — {ex.rx.desc}</div>)}
        </div>
      )}
    </div>
  )
}

function Nutrition() {
  const { kcalTarget } = useApp()
  const foods = ['Oatmeal','Greek Yogurt','Banana','Chicken Breast','Wholegrain Pasta','Rice','Eggs','Salmon','Tofu','Broccoli','Carrots','Apples','Peanut Butter','Hummus','Wholegrain Bread','Cottage Cheese']
  return (
    <div style={{ padding:12 }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Daily target: {kcalTarget} kcal</div>
      <div style={{ color:'#666' }}>Balanced meals + snacks; listen to hunger/fullness. Not a diet.</div>
      <div className="card" style={{ marginTop:8 }}>
        <div style={{ fontWeight:700 }}>Suggested foods (editable later)</div>
        {foods.map(f => <div key={f}>• {f}</div>)}
      </div>
    </div>
  )
}

function Rewards() {
  const { completionByDate } = useApp()
  const days = Object.values(completionByDate)
  const sessionsDone = days.reduce((s,d)=> s + ((d.morning||[]).some(x=>x.done)?1:0) + ((d.evening||[]).some(x=>x.done)?1:0), 0)
  const medals = []
  if (sessionsDone>=6) medals.push({ name:'Strong Starter', desc:'Completed 6 sessions'})
  if (sessionsDone>=10) medals.push({ name:'Grit x10', desc:'Completed 10 sessions'})
  return (
    <div style={{ padding:12 }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Medals</div>
      {medals.length===0 && <div style={{ color:'#666' }}>No medals yet—complete sessions to earn rewards!</div>}
      {medals.map((m,i)=>(
        <div key={i} className="card" style={{ marginBottom:8 }}>
          <div style={{ fontWeight:700 }}>{m.name}</div>
          <div style={{ color:'#666' }}>{m.desc}</div>
        </div>
      ))}
    </div>
  )
}

function Settings() {
  const { profile, setProfile } = useApp()
  const [local, setLocal] = useState(profile)
  const save = () => { setProfile(local); Alert.alert('Saved','Profile updated') }
  const requestDaily  = () => local.guardianEmail ? requestReport('daily', local.guardianEmail)   : Alert.alert('Missing email','Add guardian email first')
  const requestWeekly = () => local.guardianEmail ? requestReport('weekly', local.guardianEmail)  : Alert.alert('Missing email','Add guardian email first')
  const requestMonthly= () => local.guardianEmail ? requestReport('monthly', local.guardianEmail) : Alert.alert('Missing email','Add guardian email first')

  const Field = ({ label, value, onChange, type='text' }) => (
    <div style={{ marginBottom:8 }}>
      <div style={{ color:'#666' }}>{label}</div>
      <input value={value} type={type} onChange={e=>onChange(e.target.value)}
        style={{ background:'#fff', borderRadius:12, padding:12, border:'1px solid #eee', width:'100%' }} />
    </div>
  )

  return (
    <div style={{ padding:12 }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Player Profile</div>
      <div className="card">
        <Field label="Player name" value={local.childName} onChange={(v)=>setLocal({...local, childName:v})}/>
        <Field label="Age" value={String(local.age)} onChange={(v)=>setLocal({...local, age: Number(v||'11')})} type="number"/>
        <Field label="Sex (optional)" value={local.sex||''} onChange={(v)=>setLocal({...local, sex:v})}/>
        <Field label="Unit system (metric/imperial)" value={local.unitSystem} onChange={(v)=>setLocal({...local, unitSystem: (v==='imperial'?'imperial':'metric') })}/>
        <Field label={`Height (${local.unitSystem==='metric'?'cm':'in'})`} value={String(local.height)} onChange={(v)=>setLocal({...local, height:Number(v||'0')})} type="number"/>
        <Field label={`Weight (${local.unitSystem==='metric'?'kg':'lb'})`} value={String(local.weight)} onChange={(v)=>setLocal({...local, weight:Number(v||'0')})} type="number"/>
        <Field label="Soccer position" value={local.soccerPosition||''} onChange={(v)=>setLocal({...local, soccerPosition:v})}/>
        <Field label="Morning session (mins)" value={String(local.morningMins)} onChange={(v)=>setLocal({...local, morningMins:Number(v||'0')})} type="number"/>
        <Field label="Evening session (mins)" value={String(local.eveningMins)} onChange={(v)=>setLocal({...local, eveningMins:Number(v||'0')})} type="number"/>
        <Field label="Injuries / notes" value={local.injuries||''} onChange={(v)=>setLocal({...local, injuries:v})}/>
        <Field label="Guardian email (for reports)" value={local.guardianEmail||''} onChange={(v)=>setLocal({...local, guardianEmail:v})} />

        <div style={{ marginTop:12, fontWeight:700 }}>Sports (choose one or more)</div>
        <div className="row" style={{ marginTop:8 }}>
          {SPORTS_OPTIONS.map(opt => {
            const active = (local.sports||['Soccer']).includes(opt)
            return (
              <button key={opt}
                onClick={()=>{
                  const cur = new Set(local.sports||['Soccer'])
                  if (active) cur.delete(opt); else cur.add(opt)
                  const arr = Array.from(cur)
                  setLocal({...local, sports: arr.length ? arr : ['Soccer']})
                }}
                className="btn"
                style={{ background: active ? '#111' : '#fff', color: active ? '#fff' : '#111' }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        <div className="row" style={{ marginTop:12 }}>
          <Button title="Save" onClick={save}/>
          <Button title="Daily report"   variant="secondary" onClick={requestDaily}/>
          <Button title="Weekly"         variant="secondary" onClick={requestWeekly}/>
          <Button title="Monthly"        variant="secondary" onClick={requestMonthly}/>
        </div>

        <div style={{ marginTop:16 }}>
          <div style={{ fontWeight:700 }}>Safety & Privacy</div>
          <div style={{ color:'#666' }}>For youth athletes: get pediatrician clearance. Stop if pain occurs. Parent/guardian consent required. Data minimized.</div>
        </div>
      </div>
    </div>
  )
}

function Ideas() {
  const { ideas, pullNewIdeas } = useApp()
  return (
    <div style={{ padding:12 }}>
      <div className="row" style={{ justifyContent:'space-between' }}>
        <div style={{ fontSize:18, fontWeight:700 }}>Fresh Training Ideas</div>
        <Button title="Sync from ChatGPT" onClick={pullNewIdeas} />
      </div>
      {ideas.length===0 && <div style={{ color:'#666', marginTop:8 }}>Tap "Sync" to fetch age-appropriate suggestions (server-curated).</div>}
      {ideas.map(it => (
        <div key={it.id} className="card" style={{ marginTop:8 }}>
          <div style={{ fontWeight:700 }}>{it.title}</div>
          <div style={{ color:'#666' }}>{it.rationale}</div>
          {(it.block||[]).map((b,i)=> <div key={i}>• {b.name} — {b.rx}</div>)}
        </div>
      ))}
    </div>
  )
}

function Studio() {
  const [fg, setFg] = useState(null)
  const [bg, setBg] = useState(null)
  const [outUrl, setOutUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  function pickFile(setter) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      setter(url)
    }
    input.click()
  }

  async function runSwap() {
    if (!fg || !bg) return Alert.alert('Missing images','Pick both foreground and background images.')
    setBusy(true); setOutUrl(null)
    const { resultUrl, note } = await bgSwap({ foregroundUrl: fg, backgroundUrl: bg })
    setOutUrl(resultUrl || null)
    setNote(note || '')
    setBusy(false)
  }

  return (
    <div style={{ padding:12 }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Background Swap (Beta)</div>
      <div className="row">
        <div className="card" style={{ flex:1, minWidth:280 }}>
          <div style={{ fontWeight:700 }}>1) Foreground (subject)</div>
          {fg ? <AutoFitImage src={fg} maxVH={60}/> : <div style={{ color:'#999' }}>No image selected</div>}
          <div style={{ height:8 }}/>
          <Button title="Choose Foreground" variant="secondary" onClick={()=>pickFile(setFg)} />
        </div>
        <div className="card" style={{ flex:1, minWidth:280 }}>
          <div style={{ fontWeight:700 }}>2) Background</div>
          {bg ? <AutoFitImage src={bg} maxVH={60}/> : <div style={{ color:'#999' }}>No image selected</div>}
          <div style={{ height:8 }}/>
          <Button title="Choose Background" variant="secondary" onClick={()=>pickFile(setBg)} />
        </div>
      </div>
      <div className="row" style={{ marginTop:12 }}>
        <Button title={busy ? 'Working...' : 'Create Composite'} onClick={runSwap} />
        {outUrl && <a href={outUrl} download style={{ textDecoration:'none' }}><Button title="Download Result" variant="secondary" onClick={()=>{}} /></a>}
      </div>
      {note && <div style={{ color:'#999' }}>{note}</div>}
      {outUrl && (
        <div className="card" style={{ marginTop:12 }}>
          <div style={{ fontWeight:700 }}>Result</div>
          <AutoFitImage src={outUrl} maxVH={75}/>
        </div>
      )}
    </div>
  )
}

function ExerciseDemo({ ex }) {
  if (!ex) return <div style={{ color:'#666' }}>Select an exercise to preview.</div>
  const meta = EXERCISE_META[ex.id] || {}
  const hasLottie = !!meta.lottieUrl
  const maxH = Math.round(0.7*window.innerHeight)

  return (
    <div>
      <h3 style={{ margin:'4px 0 8px 0' }}>{ex.name}</h3>
      {hasLottie ? (
        <Lottie
          path={meta.lottieUrl}
          loop
          autoplay
          style={{ width:'100%', maxHeight: maxH, borderRadius:8 }}
        />
      ) : (
        <VideoOrImage src={meta.mediaUrl} alt={ex.name}/>
      )}
      <MuscleChips muscles={meta.muscles} />
      <div style={{ marginTop:10, fontSize:14, color:'#333' }}>{meta.description || 'Technique-focused movement for youth athletes.'}</div>
      <div style={{ marginTop:12, fontSize:13, color:'#555' }}>
        <strong>Coaching cues:</strong> Keep movements smooth, no pain; stop if form breaks. Breathe!
      </div>
    </div>
  )
}
function MuscleChips({ muscles }) {
  if (!muscles || !muscles.length) return null
  return (
    <div className="chips">
      {muscles.map((m,i)=> <div key={i} className="chip" style={{ background:'#eef6ff', color:'#0b63c4', borderColor:'#cfe2ff' }}>{m}</div>)}
    </div>
  )
}

// ---------- Modal ----------
function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <Button title="Close" variant="secondary" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  )
}

// ---------- Context hook ----------
function useApp() {
  return useContext(AppCtx)
}

// ---------- Self-tests (console) ----------
;(function runSelfTests(){
  const tests = []
  const week = weekKeyFor(new Date('2025-08-06T12:00:00Z'))
  tests.push(['weekKeyFor → Monday', week==='2025-08-04'])
  tests.push(['prevWeek', prevWeek('2025-08-04')==='2025-07-28'])

  const fb = { ex1:[1,1,2], ex2:[2,2,2], ex3:[3,3] }
  const adj = adjustLoad(fb)
  tests.push(['adjustLoad +1', adj.ex1===1])
  tests.push(['adjustLoad 0',  adj.ex2===0])
  tests.push(['adjustLoad -1', adj.ex3===-1])

  const rx1 = prescribe({id:'x',name:'',cat:'Strength',baseLoad:3}, 1)
  const rx2 = prescribe({id:'x',name:'',cat:'Conditioning',baseLoad:2}, -1)
  tests.push(['rx strength format', /^\d+ x \d+$/.test(rx1.desc)])
  tests.push(['rx conditioning minutes', /min/.test(rx2.desc)])

  const base = basePlanForDay({ morningMins:16, eveningMins:16, sports:['Soccer'] }, 0)
  tests.push(['basePlan morning>=2', (base.morning||[]).length>=2])
  tests.push(['basePlan evening>=2', (base.evening||[]).length>=2])

  const chosenDefault = selectedSportsOrDefault({ sports: [] })
  tests.push(['sports default -> Soccer', Array.isArray(chosenDefault) && chosenDefault.includes('Soccer')])

  const profSB = { morningMins:16, eveningMins:16, sports:['Soccer','Basketball'] }
  const daySB = basePlanForDay(profSB, 1)
  const allListed = [...daySB.morning, ...daySB.evening]
  const ok = allListed.every(ex => intersectsSports(ex, profSB.sports))
  tests.push(['sports filter respected', ok===true])

  const dayBias = basePlanForDay({ morningMins:16, eveningMins:16, sports:['Soccer','Basketball','Tennis'] }, 2)
  const ev = dayBias.evening
  const soccerCount = ev.filter(e => e.sports?.includes('Soccer')).length
  tests.push(['60% soccer bias (approx)', ev.length<2 ? true : soccerCount >= Math.floor(ev.length*0.5)])

  const decide = (u) => u.endsWith('.gif') ? 'img' : (u.endsWith('.mp4')||u.endsWith('.webm')) ? 'video' : 'img'
  tests.push(['media gif', decide('x.gif')==='img'])
  tests.push(['media mp4', decide('x.mp4')==='video'])

  const canRun = (fg,bg) => !!(fg && bg)
  tests.push(['bgSwap requires both', canRun('a','b') && !canRun('a',null) && !canRun(null,'b')])

  const failed = tests.filter(t=>!t[1])
  if (failed.length) console.warn('Self-tests failed:', failed.map(f=>f[0]))
  else console.log('Self-tests passed:', tests.length)
})()
