import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import TherapistCard from './components/TherapistCard.jsx'
import ChatBubble from './components/ChatBubble.jsx'
import RoundtableChat from "./components/RoundtableChat.jsx"

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'





export default function App(){
  const [therapists, setTherapists] = useState([])
  const [filters, setFilters] = useState(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('relevance')

  const [detail, setDetail] = useState(null)

  // chat
  const [history, setHistory] = useState([])
  const [userMsg, setUserMsg] = useState('')
  const [extras, setExtras] = useState([])
  // favorites state
  const [favorites, setFavorites] = useState([])
  const userId = "demo-user"

  // load favorites on mount
  useEffect(() => {
    fetch(`${API}/favorites/${userId}`)
      .then(r => r.json())
      .then(data => setFavorites(data.favorites || []))
  }, [])

  // sidebar filter states
  const [city, setCity] = useState('')
  const [gender, setGender] = useState('')
  const [experienceRange, setExperienceRange] = useState('')
  const [mode, setMode] = useState('')
  const [minFee, setMinFee] = useState(null)
  const [maxFee, setMaxFee] = useState(null)

  // voice recognition
  const recognition = ('webkitSpeechRecognition' in window) ? new webkitSpeechRecognition() : null
  if (recognition) {
    recognition.continuous = false
    recognition.lang = "en-US" // switch to "ur-PK" for Urdu
  }

  // fetch filters once
  useEffect(()=>{
    fetch(`${API}/therapists/filters`).then(r=>r.json()).then(setFilters)
  },[])

  // fetch therapists when filters/search/sort change
  useEffect(()=>{
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    if (city) params.append("city", city)
    if (gender) params.append("gender", gender)
    if (experienceRange) params.append("experienceRange", experienceRange)
    if (mode) params.append("mode", mode)
    if (minFee !== null) params.append("minFee", minFee)
    if (maxFee !== null) params.append("maxFee", maxFee)
    if (sort) params.append("sort", sort)

    fetch(`${API}/therapists?${params}`)
      .then(r=>r.json())
      .then(setTherapists)
      .catch(()=>setTherapists([]))
  }, [search, city, gender, experienceRange, mode, minFee, maxFee, sort])

  async function sendChat(){
    const payload = { topic: "Therapy Session", history, user_message: userMsg, user_id: "demo-user" }
    const r = await fetch(`${API}/chat/respond`, { 
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    })
    const data = await r.json()
    setHistory(data.messages || [])
    setExtras(data.extras || [])
    setUserMsg('')
  }

  function clearFilters(){
    setCity(''); setGender(''); setExperienceRange(''); setMode('');
    setMinFee(null); setMaxFee(null); setSearch('');
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-slate-900 text-white px-6 py-4 flex items-center gap-3">
        <div className="font-bold text-lg">🧠 MindCare AI</div>
        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="Search therapists (English/Urdu)..."
          className="px-3 py-2 rounded bg-slate-800 outline-none w-64"
        />
        {recognition && (
          <button
            className="px-3 py-2 bg-blue-600 rounded"
            onClick={()=>{
              recognition.start()
              recognition.onresult = (e)=>{
                const text = e.results[0][0].transcript
                setSearch(text)
              }
            }}
          >
            🎙️
          </button>
        )}
      </header>

      <main className="grid md:grid-cols-3 gap-6 p-6">
        {/* Sidebar Filters */}
        {filters && (
          <aside className="p-4 bg-white rounded-xl shadow h-fit">
            <h3 className="font-semibold mb-2">Filters</h3>

            {/* City */}
            <div className="mb-3">
              <h4 className="text-sm font-medium">City</h4>
              {Object.entries(filters.city).map(([c,count])=>(
                <label key={c} className="block text-sm">
                  <input type="radio" name="city" onChange={()=>setCity(c)} checked={city===c}/> {c} ({count})
                </label>
              ))}
            </div>

            {/* Gender */}
            <div className="mb-3">
              <h4 className="text-sm font-medium">Gender</h4>
              {Object.entries(filters.gender).map(([g,count])=>(
                <label key={g} className="block text-sm">
                  <input type="radio" name="gender" onChange={()=>setGender(g)} checked={gender===g}/> {g} ({count})
                </label>
              ))}
            </div>

            {/* Experience */}
            <div className="mb-3">
              <h4 className="text-sm font-medium">Experience</h4>
              {Object.entries(filters.experience).map(([range,count])=>(
                <label key={range} className="block text-sm">
                  <input type="radio" name="exp" onChange={()=>setExperienceRange(range)} checked={experienceRange===range}/> {range} ({count})
                </label>
              ))}
            </div>

            {/* Fee */}
            <div className="mb-3">
              <h4 className="text-sm font-medium">Fee</h4>
              <label className="block text-sm"><input type="radio" name="fee" onChange={()=>{setMinFee(0);setMaxFee(2000)}} /> &lt;2000</label>
              <label className="block text-sm"><input type="radio" name="fee" onChange={()=>{setMinFee(2000);setMaxFee(4000)}} /> 2000–4000</label>
              <label className="block text-sm"><input type="radio" name="fee" onChange={()=>{setMinFee(4000);setMaxFee(6000)}} /> 4000–6000</label>
              <label className="block text-sm"><input type="radio" name="fee" onChange={()=>{setMinFee(6000);setMaxFee(null)}} /> &gt;6000</label>
            </div>

            {/* Mode */}
            <div className="mb-3">
              <h4 className="text-sm font-medium">Mode</h4>
              {Object.entries(filters.mode).map(([m,count])=>(
                <label key={m} className="block text-sm">
                  <input type="radio" name="mode" onChange={()=>setMode(m)} checked={mode===m}/> {m} ({count})
                </label>
              ))}
            </div>

            <button
              onClick={clearFilters}
              className="mt-3 w-full text-sm px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300"
            >
              Clear All Filters
            </button>
          </aside>
        )}

        {/* Finder */}
        <section className="md:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">Therapist Finder</h2>
            <select value={sort} onChange={e=>setSort(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="relevance">Sort by: Relevance</option>
              <option value="fee_low">Fee: Low to High</option>
              <option value="fee_high">Fee: High to Low</option>
              <option value="exp_high">Experience: High to Low</option>
            </select>
          </div>
          {therapists.length === 0 ? (
            <div className="text-slate-500 text-sm">No therapists found</div>
          ) : (
            <div className="grid sm:grid-cols-1 gap-3">
  {therapists.map(t => (
    <TherapistCard
      key={t.id}
      t={t}
      onOpen={setDetail}
      userId={userId}
      favorites={favorites}
      setFavorites={setFavorites}
    />
  ))}
</div>

          )}
        </section>

        {/* Multi-AI Chat */}
<section className="md:col-span-1">
  <h2 className="font-semibold text-slate-800 mb-3">AI Roundtable Chat</h2>
  <RoundtableChat />
</section>


      </main>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={()=>setDetail(null)}>
          <motion.div
            initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}
            className="bg-white rounded-2xl w-[720px] max-w-[95vw] max-h-[90vh] overflow-hidden"
            onClick={e=>e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="text-lg font-bold">Therapist Details</div>
              <button className="text-slate-500 hover:text-slate-800" onClick={()=>setDetail(null)}>✕</button>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-4 overflow-y-auto" style={{maxHeight: 'calc(90vh - 136px)'}}>
              <div className="text-xl font-bold mb-1">👤 {detail.name}</div>
              <div className="text-sm text-slate-500 mb-2">
                {detail.gender || '—'} • {detail.experience_years || 0} years experience • {detail.expertise || '—'}
              </div>

              <div className="text-sm">
                <div>📍 {detail.city || '—'}  &nbsp;  💰 {detail.fees_raw || '—'}</div>
                <div className="mt-1">📞 {detail.phone || 'N/A'} &nbsp; ✉️ {detail.email || 'N/A'}</div>
              </div>

              <h4 className="mt-4 font-semibold">Education</h4>
              <ul className="text-sm list-disc ml-5">
                {(detail.education || '').split(';').filter(Boolean).map((line, i)=><li key={i}>{line.trim()}</li>)}
              </ul>

              <h4 className="mt-4 font-semibold">Experience</h4>
              <ul className="text-sm list-disc ml-5">
                {(detail.experience || '').split(';').filter(Boolean).map((line, i)=><li key={i}>{line.trim()}</li>)}
              </ul>

              <h4 className="mt-4 font-semibold">Areas of Expertise</h4>
              <p className="text-sm">
                {(detail.expertise || '—').replace(/;/g, ' • ')}
              </p>

              <h4 className="mt-4 font-semibold">About</h4>
              <p className="text-sm whitespace-pre-wrap">{detail.about || '—'}</p>

              <h4 className="mt-4 font-semibold">Consultation Modes</h4>
              <ul className="text-sm">
                {(detail.modes || []).map(m => <li key={m}>✅ {m}</li>)}
              </ul>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex gap-3 justify-end bg-white">
              <button className="px-4 py-2 rounded bg-green-600 text-white">📞 Call Now</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white">✉️ Send Email</button>
              <button className="px-4 py-2 rounded bg-slate-700 text-white">🔗 Visit Profile</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
