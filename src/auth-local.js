// src/auth-local.js
import React, { createContext, useContext, useEffect, useState } from 'react'

// ⚠️ דמו בלבד. זה שומר משתמשים בדפדפן (localStorage). לא לפרודקשן.
const LS_USERS = 'yt_users_v1'
const LS_SESSION = 'yt_session_v1'

function readUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS)) || [] } catch { return [] }
}
function writeUsers(list) {
  localStorage.setItem(LS_USERS, JSON.stringify(list))
}
function setSession(user) {
  if (user) localStorage.setItem(LS_SESSION, JSON.stringify({ id:user.id, email:user.email, username:user.username }))
  else localStorage.removeItem(LS_SESSION)
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(LS_SESSION)) || null } catch { return null }
}

// hash דמו (לא אמיתי): הופך סיסמה ל-“hash” פשוט כדי לא לשמור טקסט גלוי.
async function fakeHash(str) {
  // נשתמש ב-SubtleCrypto אם קיים, אחרת נפול לדמו פשוט.
  if (window.crypto?.subtle) {
    const enc = new TextEncoder().encode(str)
    const buf = await crypto.subtle.digest('SHA-256', enc)
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')
  }
  return 'h_' + btoa(unescape(encodeURIComponent(str))) // דמו בלבד
}

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getSession()
    setUser(s)
    setLoading(false)
  }, [])

  async function signUp({ email, password, username }) {
    const users = readUsers()
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Email already registered')
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) throw new Error('Username already taken')
    const passHash = await fakeHash(password)
    const u = { id: crypto.randomUUID(), email, username, passHash, createdAt: new Date().toISOString() }
    users.push(u); writeUsers(users); setSession(u); setUser(u)
    return u
  }

  async function signIn({ identifier, password }) {
    const users = readUsers()
    const passHash = await fakeHash(password)
    const idLower = identifier.toLowerCase()
    const u = users.find(u =>
      u.email.toLowerCase() === idLower || u.username.toLowerCase() === idLower
    )
    if (!u) throw new Error('User not found')
    if (u.passHash !== passHash) throw new Error('Wrong password')
    setSession(u); setUser(u); return u
  }

  async function signOut() {
    setSession(null); setUser(null)
  }

  const value = { user, loading, signIn, signUp, signOut }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
