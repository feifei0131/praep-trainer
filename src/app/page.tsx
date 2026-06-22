'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { VerbPreposition } from '@/types'
import { translations, Lang } from '@/lib/i18n'

const LEVELS = ['A1', 'A2', 'B1', 'B2']

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

function getMainVerb(verb: string): string {
  return verb.replace(/^sich\s+/i, '')
}

function getInitial(verb: string): string {
  return getMainVerb(verb)[0].toUpperCase()
}

// ── Confirm dialog for batch add ──────────────────────────────────────────────
function ConfirmDialog({
  count, lang, onConfirm, onCancel,
}: {
  count: number
  lang: Lang
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {lang === 'zh' ? '批量加入学习库' : 'Batch add to flashcards'}
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          {lang === 'zh'
            ? `将把当前筛选出的 ${count} 个词条全部加入学习库（已加入的不会重复添加），确认吗？`
            : `This will add all ${count} filtered entries to your flashcards (duplicates skipped). Confirm?`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            {lang === 'zh' ? '确认加入' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ── Slides data ───────────────────────────────────────────────────────────────
const SLIDES = [
  { zh: '/slides/German_Preposition_Spatial_Logic_001.png', en: '/slides/German_Preposition_Spatial_Logic_002.png' },
  { zh: '/slides/German_Preposition_Spatial_Logic_003.png', en: '/slides/German_Preposition_Spatial_Logic_004.png' },
  { zh: '/slides/German_Preposition_Spatial_Logic_005.png', en: '/slides/German_Preposition_Spatial_Logic_006.png' },
  { zh: '/slides/German_Preposition_Spatial_Logic_007.png', en: '/slides/German_Preposition_Spatial_Logic_008.png' },
  { zh: '/slides/German_Preposition_Spatial_Logic_009.png', en: '/slides/German_Preposition_Spatial_Logic_010.png' },
  { zh: '/slides/German_Preposition_Spatial_Logic_011.png', en: '/slides/German_Preposition_Spatial_Logic_012.png' },
  { zh: '/slides/German_Preposition_Spatial_Logic_013.png', en: '/slides/German_Preposition_Spatial_Logic_014.png' },
]

// ── Lightbox ──────────────────────────────────────────────────────────────────
function SlidesLightbox({ lang, startIndex, onClose }: {
  lang: Lang
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const total = SLIDES.length

  const prev = useCallback(() => setIndex(i => (i - 1 + total) % total), [total])
  const next = useCallback(() => setIndex(i => (i + 1) % total), [total])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
      onClick={onClose}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none z-10"
      >
        ×
      </button>

      {/* Image */}
      <div className="relative w-full max-w-5xl px-12 flex items-center justify-center"
        onClick={e => e.stopPropagation()}>
        {/* Prev */}
        <button
          onClick={prev}
          className="absolute left-0 text-white/60 hover:text-white text-4xl px-3 py-6 transition-colors"
        >
          ‹
        </button>

        <img
          src={SLIDES[index][lang]}
          alt={`Slide ${index + 1}`}
          className="w-full rounded-xl shadow-2xl select-none"
          style={{ maxHeight: '80vh', objectFit: 'contain' }}
        />

        {/* Next */}
        <button
          onClick={next}
          className="absolute right-0 text-white/60 hover:text-white text-4xl px-3 py-6 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mt-5" onClick={e => e.stopPropagation()}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === index ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Counter */}
      <p className="text-white/40 text-xs mt-2">
        {index + 1} / {total}
      </p>
    </div>
  )
}

export default function Home() {
  const [entries, setEntries] = useState<VerbPreposition[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [prepFilter, setPrepFilter] = useState('all')
  const [initialFilter, setInitialFilter] = useState('all')
  const [lang, setLang] = useState<Lang>('zh')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  // flashcard stats for header badge
  const [fcTotal, setFcTotal] = useState(0)
  const [fcDue, setFcDue] = useState(0)

  const t = translations[lang]

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from('verb_prepositions')
        .select('*')
        .eq('is_published', true)
        .order('level')
        .order('verb')
      if (data) setEntries(data)
      setLoading(false)
    }

    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const name = user.user_metadata?.display_name || user.email?.split('@')[0] || null
        setDisplayName(name)
        const { data: cards } = await supabase
          .from('user_flashcards')
          .select('entry_id, next_review, mastered')
          .eq('user_id', user.id)
        if (cards) {
          setSavedIds(new Set(cards.map(c => c.entry_id)))
          const now = new Date()
          setFcTotal(cards.length)
          setFcDue(cards.filter(c => !c.mastered && new Date(c.next_review) <= now).length)
        }
      }
    }

    load()
    getUser()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUserId(null)
    setDisplayName(null)
    setSavedIds(new Set())
    setFcTotal(0)
    setFcDue(0)
  }

  const allPreps = useMemo(() => {
    return [...new Set(entries.map(e => e.preposition))].sort()
  }, [entries])

  const availableInitials = useMemo(() => {
    return [...new Set(entries.map(e => getInitial(e.verb)))].sort()
  }, [entries])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return entries.filter(e => {
      if (levelFilter !== 'all' && e.level !== levelFilter) return false
      if (prepFilter !== 'all' && e.preposition !== prepFilter) return false
      if (initialFilter !== 'all' && getInitial(e.verb) !== initialFilter) return false
      if (!q) return true
      return (
        e.verb.toLowerCase().includes(q) ||
        e.preposition.toLowerCase().includes(q) ||
        e.meaning_zh.includes(q) ||
        e.meaning_en.toLowerCase().includes(q) ||
        e.example_de.toLowerCase().includes(q)
      )
    })
  }, [entries, search, levelFilter, prepFilter, initialFilter])

  // How many in current filter are not yet saved
  const unsavedFiltered = useMemo(
    () => filtered.filter(e => !savedIds.has(e.id)),
    [filtered, savedIds]
  )

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2500)
  }

  // ── Single toggle ──────────────────────────────────────────────────────────
  async function toggleFlashcard(entry: VerbPreposition) {
    if (!userId) { showToast(t.loginToSave); return }
    const supabase = createClient()
    if (savedIds.has(entry.id)) {
      await supabase.from('user_flashcards').delete().eq('user_id', userId).eq('entry_id', entry.id)
      setSavedIds(prev => { const s = new Set(prev); s.delete(entry.id); return s })
      setFcTotal(prev => Math.max(0, prev - 1))
    } else {
      await supabase.from('user_flashcards').insert({ user_id: userId, entry_id: entry.id })
      setSavedIds(prev => new Set([...prev, entry.id]))
      setFcTotal(prev => prev + 1)
      setFcDue(prev => prev + 1) // new card is due immediately
      showToast(lang === 'zh'
        ? `已将 "${entry.verb} + ${entry.preposition}" 加入学习库`
        : `Added "${entry.verb} + ${entry.preposition}" to flashcards`)
    }
  }

  // ── Batch add ──────────────────────────────────────────────────────────────
  async function handleBatchAdd() {
    if (!userId || unsavedFiltered.length === 0) return
    setBatchLoading(true)
    setShowConfirm(false)
    const supabase = createClient()
    const rows = unsavedFiltered.map(e => ({ user_id: userId, entry_id: e.id }))
    await supabase.from('user_flashcards').insert(rows)
    const newIds = new Set([...savedIds, ...unsavedFiltered.map(e => e.id)])
    setSavedIds(newIds)
    setFcTotal(newIds.size)
    setBatchLoading(false)
    showToast(lang === 'zh'
      ? `已批量加入 ${rows.length} 个词条`
      : `Added ${rows.length} entries to flashcards`)
  }

  // ── Is filter active? ──────────────────────────────────────────────────────
  const isFiltered = levelFilter !== 'all' || prepFilter !== 'all' || initialFilter !== 'all' || search.trim() !== ''

  return (
    <div className="min-h-screen bg-gray-50">
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toastMsg}
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          count={unsavedFiltered.length}
          lang={lang}
          onConfirm={handleBatchAdd}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="shrink-0">
            <h1 className="text-lg font-semibold text-gray-900">{t.appName}</h1>
            <p className="text-xs text-gray-500">{t.appSubtitle}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {userId ? (
              <>
                <span className="text-gray-500 hidden sm:inline">👤 {displayName}</span>
                <Link href="/flashcards" className="relative px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                  <span>{t.myFlashcards}</span>
                  {fcTotal > 0 && (
                    <span className="text-xs font-medium text-gray-400">{fcTotal}</span>
                  )}
                  {fcDue > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {fcDue}
                    </span>
                  )}
                </Link>
                <button onClick={handleLogout} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  {t.login}
                </Link>
                <Link href="/register" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  {t.register}
                </Link>
              </>
            )}
            <button
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t.langToggle}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Lightbox */}
        {lightboxOpen && (
          <SlidesLightbox
            lang={lang}
            startIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        {/* Slides banner */}
        <div
          className="mb-5 rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer group relative"
          onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
        >
          {/* Thumbnail row: image left + text right */}
          <div className="flex items-stretch bg-white">
            <img
              src={SLIDES[0][lang]}
              alt={lang === 'zh' ? '介词规律讲解' : 'Preposition Framework'}
              className="w-48 sm:w-64 object-cover shrink-0 transition-transform duration-300 group-hover:scale-[1.02]"
              style={{ aspectRatio: '16/9', objectFit: 'cover', objectPosition: 'center' }}
            />
            <div className="flex flex-col justify-center px-5 py-4 bg-gradient-to-r from-slate-50 to-white">
              <p className="font-bold text-gray-900 text-sm sm:text-base">
                {lang === 'zh' ? '📐 介词规律讲解' : '📐 Preposition Framework'}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                {lang === 'zh'
                  ? '告别死记硬背，理解语义逻辑 · 共 7 张图解'
                  : 'Stop guessing — learn the semantic logic · 7 illustrated slides'}
              </p>
              <p className="text-blue-600 text-xs mt-2 font-medium">
                {lang === 'zh' ? '点击展开 →' : 'Tap to open →'}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.search}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Initial filter */}
        <div className="flex flex-wrap gap-1 mb-3">
          <button
            onClick={() => setInitialFilter('all')}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
              initialFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.allInitials}
          </button>
          {availableInitials.map(letter => (
            <button
              key={letter}
              onClick={() => setInitialFilter(initialFilter === letter ? 'all' : letter)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                initialFilter === letter ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Level filter */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              levelFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.allLevels}
          </button>
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setLevelFilter(levelFilter === l ? 'all' : l)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                levelFilter === l ? 'bg-gray-900 text-white' : `${LEVEL_COLORS[l]} hover:opacity-80`
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Prep filter */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          <button
            onClick={() => setPrepFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              prepFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.allPreps}
          </button>
          {allPreps.map(p => (
            <button
              key={p}
              onClick={() => setPrepFilter(prepFilter === p ? 'all' : p)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                prepFilter === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Count + batch add */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400">
            {loading ? (lang === 'zh' ? '加载中…' : 'Loading…') : t.results(filtered.length)}
          </p>
          {/* Batch add button: show when logged in and there are unsaved entries in current filter */}
          {userId && !loading && unsavedFiltered.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={batchLoading}
              className="text-xs px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {batchLoading
                ? (lang === 'zh' ? '加入中…' : 'Adding…')
                : (lang === 'zh'
                  ? `批量加入 ${unsavedFiltered.length} 个`
                  : `Add all ${unsavedFiltered.length}`)}
            </button>
          )}
        </div>

        {/* Entries */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-1">{t.noResults}</p>
            <p className="text-sm">{t.noResultsHint}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(entry => {
              const expanded = expandedId === entry.id
              const saved = savedIds.has(entry.id)
              return (
                <div key={entry.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div
                    className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
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
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-gray-500 hidden sm:block truncate max-w-[200px]">
                        {lang === 'zh' ? entry.meaning_zh : entry.meaning_en}
                      </span>
                      <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  <div className="px-4 pb-2 sm:hidden text-sm text-gray-500">
                    {lang === 'zh' ? entry.meaning_zh : entry.meaning_en}
                  </div>

                  {expanded && (
                    <div className="border-t border-gray-100 px-4 py-4 space-y-3 bg-gray-50">
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">{t.exampleLabel}</p>
                        <p className="text-sm font-medium text-gray-900">{entry.example_de}</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {lang === 'zh' ? entry.example_zh : entry.example_en}
                        </p>
                      </div>

                      {(lang === 'zh' ? entry.common_error_zh : entry.common_error_en) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                          <p className="text-xs font-medium text-amber-700 mb-1">⚠️ {t.errorLabel}</p>
                          <p className="text-sm text-amber-800">
                            {lang === 'zh' ? entry.common_error_zh : entry.common_error_en}
                          </p>
                        </div>
                      )}

                      {entry.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="pt-1">
                        <button
                          onClick={e => { e.stopPropagation(); toggleFlashcard(entry) }}
                          className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                            saved
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : userId
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {saved ? t.addedToFlashcard : t.addToFlashcard}
                        </button>
                        {!userId && (
                          <p className="text-xs text-gray-400 mt-1.5">
                            <Link href="/login?from=/" className="text-blue-500 hover:underline">{t.login}</Link>
                            {lang === 'zh' ? ' 后可加入学习库' : ' to save flashcards'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
