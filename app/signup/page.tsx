'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setMessage('המשתמש לא נוצר.')
      setLoading(false)
      return
    }

    setMessage('ההרשמה הצליחה! אפשר להתחבר.')
    setLoading(false)
    setFullName('')
    setEmail('')
    setPassword('')
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-sm flex-col justify-center rounded-[32px] bg-white p-6 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-2xl font-bold text-white">
            K
          </div>
          <h1 className="text-3xl font-bold text-gray-900">הרשמה</h1>
          <p className="mt-2 text-sm text-gray-500">
            בוא ניצור לך חשבון חדש
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              שם מלא
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-black"
              placeholder="הכנס שם מלא"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-black"
              placeholder="הכנס אימייל"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-black"
              placeholder="הכנס סיסמה"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black p-3 text-base font-medium text-white transition disabled:opacity-50"
          >
            {loading ? 'נרשם...' : 'הירשם'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          כבר יש לך חשבון?{' '}
          <a href="/login" className="font-medium text-black underline">
            להתחברות
          </a>
        </p>
      </div>
    </main>
  )
}