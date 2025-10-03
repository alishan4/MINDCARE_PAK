import React from 'react'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function TherapistCard({ t, onOpen, userId, favorites, setFavorites }) {
  const isFav = favorites.includes(t.id)

  async function toggleFavorite(e) {
    e.stopPropagation()
    if (isFav) {
      // remove locally
      setFavorites(favorites.filter(id => id !== t.id))
    } else {
      // add to backend
      await fetch(`${API}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, therapist_id: t.id })
      })
      setFavorites([...favorites, t.id])
    }
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer relative"
         onClick={() => onOpen(t)}>
      {/* ❤️ Favorite toggle */}
      <button
        onClick={toggleFavorite}
        className="absolute top-2 right-2 text-xl"
      >
        {isFav ? "❤️" : "🤍"}
      </button>

      <div className="flex items-center gap-2">
        <div className="text-2xl">👤</div>
        <div>
          <div className="font-semibold text-slate-800">{t.name}</div>
          <div className="text-yellow-500 text-sm">⭐⭐⭐⭐⭐</div>
        </div>
      </div>

      <div className="mt-2 text-sm text-slate-500">📍 {t.city} • {t.gender || '—'}</div>
      <div className="mt-1 text-sm">💰 {t.fees_raw || 'N/A'}</div>
      <div className="mt-1 text-sm">🕒 {t.experience_years} years exp.</div>
      <button
        className="mt-3 px-3 py-1 rounded bg-blue-600 text-white text-sm"
        onClick={(e) => { e.stopPropagation(); onOpen(t) }}
      >
        View Details
      </button>
    </div>
  )
}
