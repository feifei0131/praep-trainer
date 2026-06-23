'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { translations, Lang } from '@/lib/i18n'

export default function ForgotPasswordPage() {
  const [lang, setLang] = useState<Lang>('zh')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t = translations[lang]

  async function handleSubmit() {
    if (!email) return
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError(lang === 'zh' ? '发送失败，请检查邮箱地址。' : 'Failed to send. Please check your email address.')
    } else {
      setSent(true)
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
          {sent ? (
            <>
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {lang === 'zh' ? '邮件已发送' : 'Email sent'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {lang === 'zh'
                  ? `重置密码链接已发送到 ${email}，请查收邮件并点击链接完成重置。`
                  : `A password reset link has been sent to ${email}. Please check your inbox.`}
              </p>
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:underline"
              >
                ← {lang === 'zh' ? '返回登录' : 'Back to login'}
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {lang === 'zh' ? '重置密码' : 'Reset password'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {lang === 'zh'
                  ? '输入注册邮箱，我们会发送重置链接给你。'
                  : 'Enter your email and we\'ll send you a reset link.'}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'zh' ? '邮箱' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder={lang === 'zh' ? '请输入注册邮箱' : 'Enter your email'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading || !email}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? (lang === 'zh' ? '发送中…' : 'Sending…')
                    : (lang === 'zh' ? '发送重置链接' : 'Send reset link')}
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-8">
                <Link href="/login" className="hover:text-gray-600">
                  ← {lang === 'zh' ? '返回登录' : 'Back to login'}
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
