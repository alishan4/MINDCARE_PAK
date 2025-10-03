
import React from 'react'

export default function ChatBubble({ who, name, avatar, color, children }) {
  const isUser = who === 'user'
  const align = isUser ? 'items-end' : 'items-start'
  const bubbleStyle = isUser
    ? 'bg-blue-600 text-white'
    : `${color || 'bg-white'} text-slate-900`

  return (
    <div className={`flex ${align} my-3`}>
      {!isUser && <div className="mr-2 text-2xl">{avatar}</div>}
      <div className={`max-w-[70%] px-4 py-3 rounded-2xl shadow ${bubbleStyle}`}>
        {!isUser && name && (
          <div className="text-xs font-semibold mb-1 opacity-80">{name}</div>
        )}
        {children}
      </div>
    </div>
  )
}
