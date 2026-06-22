'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { translations, Lang } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('from') || '/'

  const [lang, setLang] = useState<Lang>('zh')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const t = translations[lang]

  async function handleLogin() {
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(lang === 'zh' ? '邮箱或密码错误，请重试。' : 'Incorrect email or password.')
    } else {
      router.push(redirectTo)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
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

      {/* Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {lang === 'zh' ? '登录账号' : 'Log in'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {lang === 'zh' ? '还没有账号？' : "Don't have an account? "}
            <Link
              href={`/register${redirectTo !== '/' ? `?from=${redirectTo}` : ''}`}
              className="text-blue-600 hover:underline font-medium"
            >
              {t.register}
            </Link>
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
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder={lang === 'zh' ? '请输入邮箱' : 'Enter your email'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'zh' ? '密码' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder={lang === 'zh' ? '请输入密码' : 'Enter your password'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? (lang === 'zh' ? '登录中…' : 'Logging in…')
                : t.login}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            <Link href="/" className="hover:text-gray-600">
              ← {lang === 'zh' ? '返回首页' : 'Back to home'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
