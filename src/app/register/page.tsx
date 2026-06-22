'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { translations, Lang } from '@/lib/i18n'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('from') || '/'

  const [lang, setLang] = useState<Lang>('zh')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const t = translations[lang]

  async function handleRegister() {
    setError(null)

    if (password.length < 6) {
      setError(lang === 'zh' ? '密码至少需要 6 位。' : 'Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
      },
    })

    setLoading(false)

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError(lang === 'zh' ? '该邮箱已注册，请直接登录。' : 'Email already registered. Please log in.')
      } else {
        setError(signUpError.message)
      }
      return
    }

    // Confirm email is OFF in Supabase → user is logged in immediately
    if (data.session) {
      router.push(redirectTo)
      router.refresh()
    } else {
      // Confirm email is ON → show success message
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <Link href="/">
              <h1 className="text-lg font-semibold text-gray-900">{t.appName}</h1>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {lang === 'zh' ? '请查收验证邮件' : 'Check your email'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {lang === 'zh'
                ? `我们已向 ${email} 发送了验证链接，点击后即可登录。`
                : `We sent a confirmation link to ${email}. Click it to activate your account.`}
            </p>
            <Link href="/login" className="text-blue-600 text-sm hover:underline">
              {lang === 'zh' ? '返回登录页' : 'Back to login'}
            </Link>
          </div>
        </main>
      </div>
    )
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
            {lang === 'zh' ? '创建账号' : 'Create an account'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {lang === 'zh' ? '已有账号？' : 'Already have an account? '}
            <Link
              href={`/login${redirectTo !== '/' ? `?from=${redirectTo}` : ''}`}
              className="text-blue-600 hover:underline font-medium"
            >
              {t.login}
            </Link>
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'zh' ? '昵称（可选）' : 'Display name (optional)'}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={lang === 'zh' ? '留空则使用邮箱前缀' : 'Leave blank to use email prefix'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'zh' ? '邮箱' : 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                placeholder={lang === 'zh' ? '至少 6 位' : 'At least 6 characters'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? (lang === 'zh' ? '注册中…' : 'Creating account…')
                : t.register}
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
