'use client'

import { useState, useEffect } from 'react'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { ProductRecommendation } from '@/lib/gemini'
import { buildAmazonUrl, buildFlipkartUrl, buildFirstCryUrl } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

const CATEGORIES = ['Toys', 'Books', 'Clothes', 'Gear', 'Feeding', 'Sleep']

export default function ProductsPage() {
  const { baby, ageMonths } = useBaby()
  const [category, setCategory] = useState('Toys')
  const [products, setProducts] = useState<ProductRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (baby) loadProducts() }, [baby, category])

  async function loadProducts() {
    if (!baby) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ babyId: baby.id, babyName: baby.name, gender: baby.gender, ageMonths, category }),
      })
      const json = await res.json()
      if (json.products) {
        setProducts(json.products)
      } else {
        setError('Could not load products. Please try again.')
      }
    } catch {
      setError('Network error.')
    }
    setLoading(false)
  }

  const tierConfig = [
    { key: 'budget', label: 'Budget', emoji: '💚', color: '#22C55E', buildUrl: buildAmazonUrl, retailer: 'Amazon.in' },
    { key: 'mid',    label: 'Mid',    emoji: '💛', color: '#F59E0B', buildUrl: buildFlipkartUrl, retailer: 'Flipkart' },
    { key: 'premium',label: 'Premium',emoji: '💜', color: '#9B8EC4', buildUrl: buildFirstCryUrl, retailer: 'FirstCry' },
  ]

  return (
    <div>
      <AppBar title={`Products · ${ageMonths}m`} showBack />

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px', overflowX: 'auto' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} className={`pill-tab ${category === cat ? 'active' : ''}`}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🛍️</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#9B8EC4' }}>Finding age-appropriate products…</p>
            <p style={{ fontSize: 13, color: '#6B6B7B', marginTop: 6 }}>Prices in ₹ · Amazon.in · Flipkart · FirstCry</p>
          </div>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 14, padding: 16, textAlign: 'center' }}>
            <p style={{ color: '#DC2626', fontWeight: 600, fontSize: 14 }}>{error}</p>
            <button onClick={loadProducts} style={{ marginTop: 12, color: '#9B8EC4', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Try again</button>
          </div>
        )}

        {products.map((product, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 20, padding: 20, border: '1.5px solid #EBEBF0', marginBottom: 14 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#2D2D3A', marginBottom: 6 }}>{product.name}</p>
            <p style={{ fontSize: 13, color: '#6B6B7B', lineHeight: 1.5, marginBottom: 16 }}>{product.reason}</p>

            {tierConfig.map(tier => {
              const data = product[tier.key as keyof ProductRecommendation] as { description: string; searchTerm: string; price: string }
              if (!data) return null
              return (
                <div key={tier.key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{tier.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tier.label}</span>
                      <span style={{ fontSize: 12, color: '#6B6B7B' }}>· {data.price}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#2D2D3A', marginBottom: 8 }}>{data.description}</p>
                  <a
                    href={tier.buildUrl(data.searchTerm)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 13, fontWeight: 700, color: tier.color,
                      background: tier.color + '15', borderRadius: 10,
                      padding: '7px 14px', textDecoration: 'none',
                    }}
                  >
                    Search on {tier.retailer}
                    <ExternalLink size={12} />
                  </a>
                  {i < tierConfig.length - 1 && <div style={{ height: 1, background: '#F5F5F7', marginTop: 10 }} />}
                </div>
              )
            })}
          </div>
        ))}

        {!loading && products.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 32 }}>🛍️</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#2D2D3A', marginTop: 12 }}>Select a category to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
