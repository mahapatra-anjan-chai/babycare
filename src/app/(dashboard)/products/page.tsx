'use client'

import { useState, useEffect } from 'react'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { ProductRecommendation } from '@/lib/gemini'
import { buildAmazonUrl, buildFlipkartUrl, buildFirstCryUrl } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

const CATEGORIES = ['Toys', 'Books', 'Clothes', 'Gear', 'Feeding', 'Sleep']

const DEMO_PRODUCTS: Record<string, ProductRecommendation[]> = {
  Toys: [
    {
      name: 'High-contrast black & white rattle',
      reason: 'Stimulates visual tracking and grasping reflex — perfect for 3-month-old development.',
      budget: { description: 'Basic rattle set with high-contrast patterns', searchTerm: 'black white baby rattle newborn', price: '₹180–350' },
      mid: { description: 'Soft fabric activity cube with crinkle sounds', searchTerm: 'baby activity cube 3 months soft', price: '₹650–900' },
      premium: { description: 'Lamaze Freddie the Firefly multi-sensory toy', searchTerm: 'Lamaze Freddie Firefly baby toy', price: '₹1,800–2,200' },
    },
    {
      name: 'Soft teething ring',
      reason: 'Soothes gums and encourages hand-to-mouth coordination at this stage.',
      budget: { description: 'Silicone teething ring BPA-free', searchTerm: 'silicone teething ring baby BPA free', price: '₹120–250' },
      mid: { description: 'Nuby ice gel teether keys', searchTerm: 'Nuby ice gel teether keys baby', price: '₹450–700' },
      premium: { description: 'Sophie la Girafe natural rubber teether', searchTerm: 'Sophie Giraffe teether original', price: '₹2,500–3,200' },
    },
    {
      name: 'Baby gym / play mat',
      reason: 'Encourages tummy time, reaching, and sensory exploration — ideal from 0–6 months.',
      budget: { description: 'Basic padded play mat with hanging toys', searchTerm: 'baby play gym mat activity 3 months', price: '₹400–700' },
      mid: { description: 'Fisher-Price Rainforest activity gym', searchTerm: 'Fisher Price Rainforest activity gym', price: '₹1,200–1,800' },
      premium: { description: 'Tiny Love Meadow Days Super Deluxe gym', searchTerm: 'Tiny Love Super Deluxe gym meadow', price: '₹4,500–6,000' },
    },
  ],
  Feeding: [
    {
      name: 'Anti-colic feeding bottle',
      reason: 'Reduces air intake during feeding, easing colic and gas for bottle-fed babies.',
      budget: { description: 'Basic BPA-free wide-neck bottle 150ml', searchTerm: 'anti colic baby bottle BPA free wide neck', price: '₹150–300' },
      mid: { description: 'Philips Avent Natural bottle 260ml', searchTerm: 'Philips Avent Natural bottle 260ml', price: '₹650–950' },
      premium: { description: 'Dr. Brown\'s Options+ wide-neck bottle', searchTerm: 'Dr Browns Options wide neck bottle', price: '₹1,500–2,000' },
    },
    {
      name: 'Nursing pillow',
      reason: 'Supports baby\'s weight during feeds, reducing strain on mother\'s arms and back.',
      budget: { description: 'C-shaped foam nursing pillow with cover', searchTerm: 'nursing pillow breastfeeding C shaped', price: '₹350–600' },
      mid: { description: 'Mee Mee multi-function nursing pillow', searchTerm: 'Mee Mee nursing pillow multi function', price: '₹800–1,200' },
      premium: { description: 'My Brest Friend original nursing positioner', searchTerm: 'My Brest Friend nursing pillow original', price: '₹3,000–4,000' },
    },
  ],
  Sleep: [
    {
      name: 'White noise machine',
      reason: 'Mimics womb sounds to help babies fall asleep faster and stay asleep longer.',
      budget: { description: 'Basic white noise night light combo', searchTerm: 'white noise machine baby sleep', price: '₹400–700' },
      mid: { description: 'Marpac Dohm sound machine', searchTerm: 'Marpac Dohm white noise baby', price: '₹3,000–4,000' },
      premium: { description: 'Hatch Baby Rest sound machine + night light', searchTerm: 'Hatch Baby Rest sound machine', price: '₹8,000–10,000' },
    },
    {
      name: 'Swaddle blankets (muslin)',
      reason: 'Swaddling reduces startle reflex and helps newborns sleep more soundly.',
      budget: { description: 'Set of 3 soft muslin swaddle wraps', searchTerm: 'muslin swaddle blanket baby set', price: '₹250–450' },
      mid: { description: 'Aden+Anais muslin swaddle 4-pack', searchTerm: 'Aden Anais muslin swaddle 4 pack', price: '₹1,800–2,500' },
      premium: { description: 'HALO SleepSack wearable blanket newborn', searchTerm: 'HALO SleepSack wearable blanket newborn', price: '₹3,500–5,000' },
    },
  ],
}

function getDemoProducts(cat: string): ProductRecommendation[] {
  return DEMO_PRODUCTS[cat] ?? DEMO_PRODUCTS['Toys']
}

export default function ProductsPage() {
  const { baby, ageMonths } = useBaby()
  const [category, setCategory] = useState('Toys')
  const [products, setProducts] = useState<ProductRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => { if (baby) loadProducts() }, [baby, category])

  async function loadProducts() {
    if (!baby) return
    setLoading(true)
    setError('')
    setIsDemo(false)

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
        // Fall back to demo products
        setProducts(getDemoProducts(category))
        setIsDemo(true)
      }
    } catch {
      // Fall back to demo products on network error
      setProducts(getDemoProducts(category))
      setIsDemo(true)
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
        {isDemo && !loading && products.length > 0 && (
          <div style={{ background: '#FEF9C3', border: '1.5px solid #F59E0B', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <p style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
              Demo products — add a Gemini API key to get personalised recommendations
            </p>
          </div>
        )}

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
