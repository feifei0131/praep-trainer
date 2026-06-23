'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { translations, Lang } from '@/lib/i18n'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('zh')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const t = translations[lang]

  // Supabase puts the token in the URL hash; wait for the session to be set
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  async function handleReset() {
    setError(null)
    if (password.length < 6) {
      setError(lang === 'zh' ? '密码至少需要 6 位。' : 'Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError(lang === 'zh' ? '两次输入的密码不一致。' : 'Passwords do not match.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(lang === 'zh' ? '重置失败，请重新申请重置链接。' : 'Reset failed. Please request a new reset link.')
    } else {
      setDone(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <h1 className="text-lg font-semibold text-gray-900">{t.appName}</h1>
            <p className="text-xs text-gray-500">{t.appSubtitle}</p>
          </Link>
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            {t.langToggle}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {done ? (
            <>
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {lang === 'zh' ? '密码已重置' : 'Password updated'}
              </h2>
              <p className="text-sm text-gray-500">
                {lang === 'zh' ? '正在跳转到首页…' : 'Redirecting to home…'}
              </p>
            </>
          ) : !ready ? (
            <>
              <div className="text-4xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {lang === 'zh' ? '验证链接中…' : 'Verifying link…'}
              </h2>
              <p className="text-sm text-gray-500">
                {lang === 'zh'
                  ? '如果长时间无响应，链接可能已过期，请重新申请。'
                  : 'If this takes too long, your link may have expired. Please request a new one.'}
              </p>
              <p className="text-center text-xs text-gray-400 mt-6">
                <Link href="/forgot-password" className="hover:text-gray-600 text-blue-600">
                  {lang === 'zh' ? '重新发送重置链接' : 'Request a new reset link'}
                </Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {lang === 'zh' ? '设置新密码' : 'Set new password'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {lang === 'zh' ? '请输入新密码（至少 6 位）。' : 'Enter your new password (min. 6 characters).'}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'zh' ? '新密码' : 'New password'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={lang === 'zh' ? '请输入新密码' : 'Enter new password'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'zh' ? '确认新密码' : 'Confirm password'}
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                    placeholder={lang === 'zh' ? '再次输入新密码' : 'Confirm new password'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleReset}
                  disabled={loading || !password || !confirm}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? (lang === 'zh' ? '保存中…' : 'Saving…')
                    : (lang === 'zh' ? '确认重置' : 'Reset password')}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
