'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { createClient } from '@/lib/supabase'
import { compressImage } from '@/lib/compress-image'

interface Photo {
  id: string
  photo_url: string
  caption: string | null
  taken_at: string
  storage_path: string
}

interface MonthGroup {
  key: string        // "2026-04"
  label: string      // "April 2026"
  isBirthMonth: boolean
  photos: Photo[]
}

export default function PhotosPage() {
  const router = useRouter()
  const { baby, refreshBaby } = useBaby()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCaption, setNewCaption] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (baby) loadPhotos()
  }, [baby])

  async function loadPhotos() {
    if (!baby) return
    const supabase = createClient()
    const { data } = await supabase
      .from('baby_photos')
      .select('*')
      .eq('baby_id', baby.id)
      .order('taken_at', { ascending: false })
    setPhotos((data ?? []) as Photo[])
    setLoading(false)
  }

  function groupByMonth(photos: Photo[]): MonthGroup[] {
    const map = new Map<string, Photo[]>()
    for (const p of photos) {
      const [year, month] = p.taken_at.split('-')
      const key = `${year}-${month}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return Array.from(map.entries()).map(([key, photos]) => {
      const [year, month] = key.split('-')
      const d = new Date(parseInt(year), parseInt(month) - 1, 1)
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      const birthMonth = baby?.date_of_birth?.slice(0, 7)
      return { key, label, isBirthMonth: key === birthMonth, photos }
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPendingPreview(URL.createObjectURL(file))
    setShowAddForm(true)
  }

  async function handleUpload() {
    if (!baby || !pendingFile) return
    setUploading(true)
    try {
      const supabase = createClient()
      const blob = await compressImage(pendingFile, 300)
      const ext = 'jpg'
      const [year, month] = newDate.split('-')
      const filename = `${crypto.randomUUID()}.${ext}`
      const storagePath = `${baby.id}/${year}/${month}/${filename}`

      const { error: uploadError } = await supabase.storage
        .from('baby-photos')
        .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('baby-photos').getPublicUrl(storagePath)
      const photoUrl = urlData.publicUrl

      const { data: row } = await supabase.from('baby_photos').insert({
        baby_id: baby.id,
        storage_path: storagePath,
        photo_url: photoUrl,
        caption: newCaption.trim() || null,
        taken_at: newDate,
      }).select().single()

      if (row) {
        setPhotos(prev => [row as Photo, ...prev])
        // Expand the month this photo landed in
        const [y, m] = newDate.split('-')
        setExpandedMonths(prev => new Set([...prev, `${y}-${m}`]))
      }

      // Reset
      setPendingFile(null)
      if (pendingPreview) URL.revokeObjectURL(pendingPreview)
      setPendingPreview(null)
      setNewCaption('')
      setNewDate(new Date().toISOString().split('T')[0])
      setShowAddForm(false)
      await refreshBaby() // refresh avatar
    } catch (err) {
      console.error('Upload failed', err)
      alert('Upload failed — please try again.')
    }
    setUploading(false)
  }

  async function deletePhoto(photo: Photo) {
    if (!baby) return
    if (!confirm('Delete this photo? This cannot be undone.')) return
    setLightbox(null)
    const supabase = createClient()
    await supabase.storage.from('baby-photos').remove([photo.storage_path])
    await supabase.from('baby_photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    await refreshBaby()
  }

  const groups = groupByMonth(photos)
  const total = photos.length
  const nearLimit = total >= 450

  return (
    <div>
      <AppBar title={`${baby?.name ?? 'Baby'}'s Photos`} showBack />

      {/* Upload input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Header bar */}
      <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: '#6B6B7B', fontWeight: 600 }}>
          {total} photo{total !== 1 ? 's' : ''} {total > 0 ? `· ${Math.round(total * 0.25)} MB est.` : ''}
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            background: '#9B8EC4', color: 'white', border: 'none',
            borderRadius: 12, padding: '9px 16px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <Plus size={15} strokeWidth={3} />
          {uploading ? 'Uploading…' : 'Add Photo'}
        </button>
      </div>

      {/* Near-limit warning */}
      {nearLimit && (
        <div style={{ margin: '12px 16px 0', background: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: 14, padding: '10px 14px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
            ⚠️ {total}/500 photos — approaching storage limit
          </p>
        </div>
      )}

      {/* Add photo form */}
      {showAddForm && pendingPreview && (
        <div style={{ margin: '14px 16px 0', background: 'white', borderRadius: 20, padding: 16, border: '1.5px solid #9B8EC4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#9B8EC4' }}>Add this photo</p>
            <button onClick={() => { setShowAddForm(false); setPendingFile(null); setPendingPreview(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={18} color="#6B6B7B" />
            </button>
          </div>
          {/* Preview */}
          <img src={pendingPreview} alt="Preview" style={{ width: '100%', borderRadius: 14, maxHeight: 220, objectFit: 'cover', marginBottom: 12 }} />

          <label style={labelStyle}>Date taken</label>
          <input
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: 12 }}>Caption <span style={{ fontWeight: 400, color: '#9B9BAA' }}>(optional)</span></label>
          <input
            value={newCaption}
            onChange={e => setNewCaption(e.target.value)}
            placeholder='e.g. "First smile! 😊"'
            style={inputStyle}
          />

          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              width: '100%', marginTop: 14, background: '#9B8EC4', color: 'white',
              border: 'none', borderRadius: 12, padding: '13px', fontSize: 15,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? 'Uploading…' : 'Save Photo ✓'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && photos.length === 0 && !showAddForm && (
        <div style={{ textAlign: 'center', padding: '60px 32px', color: '#6B6B7B' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📷</div>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#2D2D3A', marginBottom: 8 }}>No photos yet</p>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>
            Tap <strong>Add Photo</strong> to start building {baby?.name}'s photo timeline
          </p>
        </div>
      )}

      {/* Month groups */}
      <div style={{ padding: '14px 0 80px' }}>
        {groups.map(group => {
          const isExpanded = expandedMonths.has(group.key)
          const previewPhotos = group.photos.slice(0, 4)
          const overflow = group.photos.length - 4

          return (
            <div key={group.key} style={{ marginBottom: 6 }}>
              {/* Month header */}
              <button
                onClick={() => setExpandedMonths(prev => {
                  const next = new Set(prev)
                  if (next.has(group.key)) next.delete(group.key)
                  else next.add(group.key)
                  return next
                })}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: '#2D2D3A' }}>
                  {group.label}{group.isBirthMonth ? ' 🎂' : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#9B8EC4', fontWeight: 700 }}>{group.photos.length} photos</span>
                  {isExpanded ? <ChevronUp size={16} color="#9B8EC4" /> : <ChevronDown size={16} color="#9B8EC4" />}
                </div>
              </button>

              {/* Collapsed: horizontal strip */}
              {!isExpanded && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px 12px' }}>
                  {previewPhotos.map(photo => (
                    <button
                      key={photo.id}
                      onClick={() => setLightbox(photo)}
                      style={{ width: 88, height: 88, borderRadius: 14, flexShrink: 0, overflow: 'hidden', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      <img src={photo.photo_url} alt={photo.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                  {overflow > 0 && (
                    <button
                      onClick={() => setExpandedMonths(prev => new Set([...prev, group.key]))}
                      style={{
                        width: 88, height: 88, borderRadius: 14, flexShrink: 0,
                        background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer',
                        color: 'white', fontSize: 18, fontWeight: 800,
                      }}
                    >
                      +{overflow}
                    </button>
                  )}
                </div>
              )}

              {/* Expanded: 3-column grid */}
              {isExpanded && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, padding: '0 16px 12px' }}>
                  {group.photos.map(photo => (
                    <button
                      key={photo.id}
                      onClick={() => setLightbox(photo)}
                      style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 10, border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      <img src={photo.photo_url} alt={photo.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}

              <div style={{ height: 1, background: '#EBEBF0', margin: '0 16px' }} />
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
            zIndex: 100, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} color="white" />
          </button>

          <img
            src={lightbox.photo_url}
            alt={lightbox.caption ?? ''}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '75dvh', borderRadius: 16, objectFit: 'contain' }}
          />

          <div onClick={e => e.stopPropagation()} style={{ marginTop: 16, textAlign: 'center', width: '100%' }}>
            {lightbox.caption && (
              <p style={{ fontSize: 15, color: 'white', fontWeight: 600, marginBottom: 6 }}>{lightbox.caption}</p>
            )}
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              {new Date(lightbox.taken_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <button
              onClick={() => deletePhoto(lightbox)}
              style={{
                marginTop: 16, background: 'rgba(239,68,68,0.2)', color: '#FCA5A5',
                border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12,
                padding: '8px 20px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#6B6B7B', display: 'block',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid #EBEBF0',
  borderRadius: 12, fontSize: 15, fontFamily: 'inherit', color: '#2D2D3A',
  background: '#FAFAF8', outline: 'none', boxSizing: 'border-box',
}
