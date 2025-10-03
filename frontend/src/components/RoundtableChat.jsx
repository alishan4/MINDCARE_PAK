import React, { useEffect, useMemo, useRef, useState } from "react"
import ChatBubble from "./ChatBubble.jsx"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

const PERSONAS = {
  CBT:        { avatar: "🧠", color: "bg-indigo-100", label: "Dr. Sarah Chen (CBT)" },
  Holistic:   { avatar: "🌿", color: "bg-emerald-100", label: "Dr. James Williams (Holistic)" },
  Analytical: { avatar: "🔍", color: "bg-yellow-100", label: "Dr. Maria Rodriguez (Analytical)" },
}

const TOPICS = [
  { id: "anxiety",     title: "Best Approaches for Treating Anxiety" },
  { id: "digital",     title: "Digital Therapy vs Traditional Sessions" },
  { id: "worklife",    title: "Work-Life Balance in Modern Times" },
  { id: "depression",  title: "Depression Treatment Approaches" },
  { id: "medication",  title: "The Role of Medication in Mental Health" },
]

export default function RoundtableChat() {
  const [topic, setTopic] = useState(TOPICS[0].id)
  const [history, setHistory] = useState([])          // all messages (AI + user)
  const [queue, setQueue] = useState([])              // next AI messages to render (with typing delays)
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)               // 1, 1.5, 2
  const [userMsg, setUserMsg] = useState("")
  const [extras, setExtras] = useState([])            // wellness / helpline cards

  const recognition = ('webkitSpeechRecognition' in window) ? new webkitSpeechRecognition() : null
  if (recognition) {
    recognition.continuous = false
    recognition.lang = "en-US" // or "ur-PK"
  }

  // Generate a “turn plan” from backend whenever topic changes (or when user interjects)
  async function fetchPlan(userText = "") {
    const payload = {
      topic,
      history,           // send full context so backend can “continue”
      user_message: userText || "",
    }
    const r = await fetch(`${API}/chat/respond`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    })
    const data = await r.json()
    // data.messages: [{role, name, content, ts, typing_ms?}, ...]
    // data.extras: wellness/helpline cards
    // We’ll enqueue only **new** AI messages; user message is already added locally.
    const newAI = (data.messages || []).filter(m => m.role !== "user")
    setQueue(q => [...q, ...newAI])
    setExtras(data.extras || [])
  }

  // When topic changes, reset and load opening round
  useEffect(() => {
    setHistory([])
    setQueue([])
    setExtras([])
    fetchPlan("")  // opening volley from the 3 personas
  }, [topic])

  // Playback loop: pop from queue with typing delay; allow pause/resume & speed
  useEffect(() => {
    if (!isPlaying || queue.length === 0) return
    let canceled = false

    const next = queue[0]
    const delay = Math.max(300, (next.typing_ms || 1200) / speed)
    const t = setTimeout(() => {
      if (canceled) return
      setHistory(h => [...h, next])
      setQueue(q => q.slice(1))
    }, delay)

    return () => { canceled = true; clearTimeout(t) }
  }, [queue, isPlaying, speed])

  // Send user message
  async function handleSend() {
    const text = (userMsg || "").trim()
    if (!text) return
    const ts = new Date().toISOString()
    const userMessage = { role:"user", name:"You", content:text, ts }
    setHistory(h => [...h, userMessage])
    setUserMsg("")
    // ask backend for the next AI turns in response
    fetchPlan(text)
  }

  // export helpers
  function exportJSON() {
    const blob = new Blob([JSON.stringify({
      topic,
      messages: history,
      extras
    }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mindcare_roundtable_${topic}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportTXT() {
    const lines = []
    lines.push(`# Topic: ${TOPICS.find(t => t.id===topic)?.title || topic}`)
    lines.push("")
    history.forEach(m => {
      const when = new Date(m.ts || Date.now()).toLocaleTimeString()
      const who = m.role === "user" ? "You" : (m.name || "AI")
      lines.push(`[${when}] ${who}: ${m.content}`)
    })
    const blob = new Blob([lines.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mindcare_roundtable_${topic}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top controls */}
      <div className="mb-3 flex items-center gap-2">
        <select
          value={topic}
          onChange={e => setTopic(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
          title="Choose a debate topic"
        >
          {TOPICS.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="px-3 py-1.5 rounded bg-slate-800 text-white text-sm"
          >
            {isPlaying ? "Pause" : "Resume"}
          </button>
          <select
            value={speed}
            onChange={e => setSpeed(parseFloat(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
            title="Playback speed"
          >
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
          
        </div>
      </div>

      {/* Participants */}
      <div className="mb-2 text-xs text-slate-500">
        Participants: {Object.entries(PERSONAS).map(([k,v]) => `${v.label}`).join(" • ")} • You
      </div>

      {/* Conversation */}
      <div className="bg-slate-100 rounded-xl p-3 h-[480px] overflow-auto">
        {history.map((m, i) => {
          const when = new Date(m.ts || Date.now()).toLocaleTimeString()
          if (m.role === "user") {
            return (
              <ChatBubble key={i} who="user">
                <div className="text-[10px] opacity-70 mb-1">{when}</div>
                {m.content}
              </ChatBubble>
            )
          }
          const meta = PERSONAS[m.name] || { avatar:"🤖", color:"bg-gray-100", label:m.name || "AI" }
          return (
            <ChatBubble key={i} who="ai" name={meta.label} avatar={meta.avatar} color={meta.color}>
              <div className="text-[10px] opacity-70 mb-1">{when}</div>
              {m.content}
            </ChatBubble>
          )
        })}

        {/* Typing indicator if queue not empty and playing */}
        {isPlaying && queue.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
            <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></div>
            typing…
          </div>
        )}

        {/* Wellness / Crisis cards */}
        {extras.map((x, i) => (
          <div key={i} className="my-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="font-semibold">{x.title}</div>
            {x.type === "wellness_card" ? (
              <div className="text-sm mt-1">
                <div>Pattern: {x.pattern} (inhale-hold-exhale)</div>
                <div className="mt-2">Follow the animated circle below for {x.duration_seconds}s.</div>
                <div className="mt-3 w-24 h-24 rounded-full bg-emerald-200 animate-ping"></div>
                <ul className="list-disc ml-5 mt-2">{x.steps.map((s, idx) => <li key={idx}>{s}</li>)}</ul>
              </div>
            ) : (
              <div className="text-sm mt-1">{x.content}</div>
            )}
          </div>
        ))}
      </div>

      {/* Input + Voice + Export */}
<div className="flex flex-wrap gap-2 mt-2 items-center">
  <input
    value={userMsg}
    onChange={e => setUserMsg(e.target.value)}
    placeholder="Type your message…"
    className="flex-1 px-3 py-2 rounded border"
    onKeyDown={(e)=>{ if(e.key==='Enter') handleSend() }}
  />

  {/* Send + Mic */}
  <button onClick={handleSend} className="px-4 py-2 rounded bg-blue-600 text-white">
    Send
  </button>
  {recognition && (
    <button
      className="px-4 py-2 rounded bg-slate-700 text-white"
      onClick={() => {
        recognition.start()
        recognition.onresult = (e) => setUserMsg(e.results[0][0].transcript)
      }}
    >
      🎙️
    </button>
  )}

  {/* Export options */}
  <button
    onClick={exportTXT}
    className="px-3 py-2 rounded bg-slate-200 text-sm"
  >
    Export .txt
  </button>
  <button
    onClick={exportJSON}
    className="px-3 py-2 rounded bg-slate-200 text-sm"
  >
    Export .json
  </button>
</div>

    </div>
  )
}
