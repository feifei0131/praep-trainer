'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { UserFlashcard, VerbPreposition } from '@/types'
import { translations, Lang } from '@/lib/i18n'

// ─── SM-2 ────────────────────────────────────────────────────────────────────
function sm2(card: FC, quality: 0 | 3) {
  let ef = card.ease_factor
  let interval = card.interval_days
  if (quality === 3) {
    if (card.review_count === 0) interval = 1
    else if (card.review_count === 1) interval = 6
    else interval = Math.round(interval * ef)
    ef = Math.max(1.3, ef + 0.1 - 2 * (0.08 + 4 * 0.02)) // quality=3 fixed
  } else {
    interval = 1
  }
  const next = new Date()
  next.setDate(next.getDate() + interval)
  return { interval_days: interval, ease_factor: ef, next_review: next.toISOString() }
}

// ─── Constants ───────────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-100 text-emerald-800',
  A2: 'bg-blue-100 text-blue-800',
  B1: 'bg-amber-100 text-amber-800',
  B2: 'bg-rose-100 text-rose-800',
}
const CASE_COLORS: Record<string, string> = {
  'Akk.': 'bg-violet-100 text-violet-700',
  'Dat.': 'bg-orange-100 text-orange-700',
  'Gen.': 'bg-gray-100 text-gray-600',
  'Nom.': 'bg-sky-100 text-sky-700',
}

function isDue(card: FC) {
  return !card.mastered && new Date(card.next_review) <= new Date()
}

// ─── Pie chart ────────────────────────────────────────────────────────────────
function PieChart({ mastered, total, lang }: { mastered: number; total: number; lang: Lang }) {
  const pct = total === 0 ? 0 : mastered / total
  const r = 40, cx = 56, cy = 56
  const x1 = cx + r * Math.cos(-Math.PI / 2)
  const y1 = cy + r * Math.sin(-Math.PI / 2)
  const angle = pct * 2 * Math.PI - Math.PI / 2
  const x2 = cx + r * Math.cos(angle)
  const y2 = cy + r * Math.sin(angle)
  const largeArc = pct > 0.5 ? 1 : 0
  const pathD = pct === 0 ? ''
    : pct >= 1 ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`
    : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${cx} ${cy} Z`

  return (
    <div className="flex items-center gap-5">
      <svg width="112" height="112" viewBox="0 0 112 112">
        <circle cx={cx} cy={cy} r={r} fill="#f3f4f6" />
        {pct > 0 && <path d={pathD} fill="#10b981" opacity="0.85" />}
        <circle cx={cx} cy={cy} r={r * 0.62} fill="white" />
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827">
          {Math.round(pct * 100)}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#6b7280">
          {lang === 'zh' ? '已掌握' : 'mastered'}
        </text>
      </svg>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-gray-700">{lang === 'zh' ? `已掌握 ${mastered} 个` : `${mastered} mastered`}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-200 shrink-0" />
          <span className="text-gray-500">{lang === 'zh' ? `学习中 ${total - mastered} 个` : `${total - mastered} learning`}</span>
        </div>
        <div className="text-xs text-gray-400">{lang === 'zh' ? `共 ${total} 个` : `${total} total`}</div>
      </div>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
type View = 'list' | 'review'
type FC = UserFlashcard & { mastered?: boolean }

// ─── Review header ────────────────────────────────────────────────────────────
function ReviewHeader({ lang, setLang, t, onBack }: {
  lang: Lang; setLang: (l: Lang) => void; t: typeof translations['zh']; onBack: () => void
}) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
          ← {lang === 'zh' ? '退出复习' : 'Exit review'}
        </button>
        <button
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          {t.langToggle}
        </button>
      </div>
    </header>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FlashcardsPage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('zh')
  const [cards, setCards] = useState<FC[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')

  // Review state
  const [queue, setQueue] = useState<FC[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const t = translations[lang]

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?from=/flashcards'); return }
      const { data } = await supabase
        .from('user_flashcards')
        .select('*, verb_prepositions(*)')
        .eq('user_id', user.id)
        .order('next_review')
      if (data) setCards(data as FC[])
      setLoading(false)
    }
    init()
  }, [router])

  // ── Remove ────────────────────────────────────────────────────────────────
  async function removeCard(cardId: string) {
    const supabase = createClient()
    await supabase.from('user_flashcards').delete().eq('id', cardId)
    setCards(prev => prev.filter(c => c.id !== cardId))
  }

  // ── Toggle mastered (star in list) ────────────────────────────────────────
  async function toggleMastered(card: FC) {
    const newVal = !card.mastered
    const supabase = createClient()
    await supabase.from('user_flashcards').update({ mastered: newVal }).eq('id', card.id)
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, mastered: newVal } : c))
  }

  // ── Start review ──────────────────────────────────────────────────────────
  // mode: 'due' = only overdue cards, 'all' = all unmastered cards
  function startReview(mode: 'due' | 'all') {
    const q = mode === 'due'
      ? cards.filter(isDue)
      : cards.filter(c => !c.mastered)
    if (q.length === 0) return
    setQueue(q)
    setQueueIndex(0)
    setFlipped(false)
    setReviewDone(false)
    setReviewedCount(0)
    setView('review')
  }

  // ── Rate card ─────────────────────────────────────────────────────────────
  // quality: 0=不会, 3=模糊, 'mastered'=掌握
  async function rateCard(quality: 0 | 3 | 'mastered') {
    const card = queue[queueIndex]
    const supabase = createClient()

    if (quality === 'mastered') {
      // Mark mastered — remove from all future review queues
      await supabase
        .from('user_flashcards')
        .update({ mastered: true })
        .eq('id', card.id)
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, mastered: true } : c))
    } else {
      const update = sm2(card, quality)
      await supabase
        .from('user_flashcards')
        .update({ ...update, review_count: card.review_count + 1 })
        .eq('id', card.id)
      setCards(prev => prev.map(c =>
        c.id === card.id ? { ...c, ...update, review_count: c.review_count + 1 } : c
      ))
    }

    const next = queueIndex + 1
    setReviewedCount(r => r + 1)
    if (next >= queue.length) {
      setReviewDone(true)
    } else {
      setQueueIndex(next)
      setFlipped(false)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const dueCount = cards.filter(isDue).length
  const unmasteredCount = cards.filter(c => !c.mastered).length
  const masteredCount = cards.filter(c => c.mastered).length
  const currentCard = queue[queueIndex]
  const currentEntry = currentCard?.verb_prepositions as VerbPreposition | undefined

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── REVIEW MODE ───────────────────────────────────────────────────────────
  if (view === 'review') {
    if (reviewDone) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <ReviewHeader lang={lang} setLang={setLang} t={t} onBack={() => setView('list')} />
          <main className="flex-1 flex items-center justify-center px-4">
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {lang === 'zh' ? '复习完成！' : 'Review complete!'}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {lang === 'zh' ? `共复习了 ${reviewedCount} 张卡片` : `You reviewed ${reviewedCount} cards`}
              </p>
              <button
                onClick={() => setView('list')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                {lang === 'zh' ? '返回学习库' : 'Back to library'}
              </button>
            </div>
          </main>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ReviewHeader lang={lang} setLang={setLang} t={t} onBack={() => setView('list')} />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          {/* Progress */}
          <div className="w-full max-w-lg mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>
                {lang === 'zh' ? `第 ${queueIndex + 1} / ${queue.length} 张` : `${queueIndex + 1} / ${queue.length}`}
              </span>
              <span>{lang === 'zh' ? '点击卡片查看答案' : 'Tap card to reveal'}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(queueIndex / queue.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Card */}
          <div
            className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-sm cursor-pointer select-none"
            style={{ minHeight: 260 }}
            onClick={() => !flipped && setFlipped(true)}
          >
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                <span className="text-3xl font-bold text-gray-900">{currentEntry?.verb}</span>
                <span className="text-2xl font-bold text-blue-600">+ {currentEntry?.preposition}</span>
              </div>
              <div className="flex justify-center gap-2 mb-6">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CASE_COLORS[currentEntry?.case_name ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                  {currentEntry?.case_name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[currentEntry?.level ?? '']}`}>
                  {currentEntry?.level}
                </span>
              </div>
              {!flipped && (
                <p className="text-gray-400 text-sm">
                  {lang === 'zh' ? '点击查看含义和例句 ↓' : 'Tap to see meaning & example ↓'}
                </p>
              )}
            </div>

            {flipped && (
              <div className="border-t border-gray-100 px-8 py-6 bg-gray-50 rounded-b-2xl space-y-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800">
                    {lang === 'zh' ? currentEntry?.meaning_zh : currentEntry?.meaning_en}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{currentEntry?.example_de}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {lang === 'zh' ? currentEntry?.example_zh : currentEntry?.example_en}
                  </p>
                </div>
                {(lang === 'zh' ? currentEntry?.common_error_zh : currentEntry?.common_error_en) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-amber-700">
                      ⚠️ {lang === 'zh' ? currentEntry?.common_error_zh : currentEntry?.common_error_en}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rating buttons — 3 choices after flip */}
          {flipped && (
            <div className="mt-6 flex gap-3 w-full max-w-lg">
              <button
                onClick={() => rateCard(0)}
                className="flex-1 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                {lang === 'zh' ? '😵 不会' : '😵 Again'}
              </button>
              <button
                onClick={() => rateCard(3)}
                className="flex-1 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors"
              >
                {lang === 'zh' ? '🤔 模糊' : '🤔 Hard'}
              </button>
              <button
                onClick={() => rateCard('mastered')}
                className="flex-1 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
              >
                {lang === 'zh' ? '✅ 已掌握' : '✅ Mastered'}
              </button>
            </div>
          )}

          {/* Hint below buttons */}
          {flipped && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              {lang === 'zh'
                ? '标记「已掌握」后不再出现在复习队列，可在列表中取消'
                : 'Marking "Mastered" removes it from review. Undo anytime in the list.'}
            </p>
          )}
        </main>
      </div>
    )
  }

  // ── LIST MODE ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">←</Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{t.myFlashcards}</h1>
              <p className="text-xs text-gray-500">
                {lang === 'zh'
                  ? `共 ${cards.length} 条 · 今日待复习 ${dueCount} 条`
                  : `${cards.length} total · ${dueCount} due today`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            {t.langToggle}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Pie chart */}
        {cards.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              {lang === 'zh' ? '学习进度' : 'Progress'}
            </p>
            <PieChart mastered={masteredCount} total={cards.length} lang={lang} />
          </div>
        )}

        {/* Review buttons */}
        {cards.length > 0 && (
          <div className="flex gap-3">
            {/* Due today */}
            <button
              onClick={() => startReview('due')}
              disabled={dueCount === 0}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors border ${
                dueCount > 0
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'
              }`}
            >
              {dueCount > 0
                ? (lang === 'zh' ? `复习今日到期 (${dueCount})` : `Review due today (${dueCount})`)
                : (lang === 'zh' ? '今日无待复习' : 'Nothing due today')}
            </button>
            {/* All unmastered */}
            <button
              onClick={() => startReview('all')}
              disabled={unmasteredCount === 0}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors border ${
                unmasteredCount > 0
                  ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  : 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'
              }`}
            >
              {lang === 'zh' ? `复习全部 (${unmasteredCount})` : `Review all (${unmasteredCount})`}
            </button>
          </div>
        )}

        {/* Card list */}
        {cards.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-1">{lang === 'zh' ? '学习库还是空的' : 'Your library is empty'}</p>
            <p className="text-sm mb-4">
              {lang === 'zh' ? '去查询页面把词条加入学习库吧' : 'Add entries from the main page'}
            </p>
            <Link href="/" className="text-blue-600 text-sm hover:underline">
              {lang === 'zh' ? '前往查询页面 →' : 'Go to search →'}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {cards.map(card => {
              const entry = card.verb_prepositions as VerbPreposition | undefined
              if (!entry) return null
              const due = isDue(card)
              const nextDate = new Date(card.next_review).toLocaleDateString(
                lang === 'zh' ? 'zh-CN' : 'en-GB',
                { month: 'short', day: 'numeric' }
              )
              return (
                <div
                  key={card.id}
                  className={`bg-white border rounded-xl shadow-sm px-4 py-3.5 flex items-center justify-between gap-3 transition-colors ${
                    card.mastered ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-base font-semibold text-gray-900">{entry.verb}</span>
                    <span className="text-blue-600 font-semibold">+ {entry.preposition}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CASE_COLORS[entry.case_name] ?? 'bg-gray-100 text-gray-600'}`}>
                      {entry.case_name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[entry.level]}`}>
                      {entry.level}
                    </span>
                    {card.mastered ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                        ✓ {lang === 'zh' ? '已掌握' : 'Mastered'}
                      </span>
                    ) : due ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                        {lang === 'zh' ? '待复习' : 'Due'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {lang === 'zh' ? `${nextDate} 复习` : `Review ${nextDate}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Star = mastered toggle */}
                    <button
                      onClick={() => toggleMastered(card)}
                      title={lang === 'zh'
                        ? (card.mastered ? '取消掌握，重新加入复习' : '标记为已掌握')
                        : (card.mastered ? 'Unmark — return to review' : 'Mark as mastered')}
                      className={`text-xl transition-colors leading-none ${
                        card.mastered ? 'text-emerald-400 hover:text-gray-300' : 'text-gray-200 hover:text-emerald-400'
                      }`}
                    >
                      ★
                    </button>
                    <button
                      onClick={() => removeCard(card.id)}
                      title={lang === 'zh' ? '从学习库移除' : 'Remove from library'}
                      className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
