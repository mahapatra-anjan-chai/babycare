'use client'

import { useState } from 'react'
import AppBar from '@/components/layout/AppBar'
import { useBaby } from '@/contexts/BabyContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEK_DATA: Record<number, { size: string; sizeEmoji: string; development: string; nutrition: string; activity: string }> = {
  4:  { size: 'Poppy seed', sizeEmoji: '🌸', development: 'The embryo is implanting. The neural tube and heart are beginning to form.', nutrition: 'Start folic acid (400–800mcg/day) if not already. Avoid alcohol and raw fish.', activity: 'Light walking is safe. Avoid heavy lifting and high-impact exercise.' },
  8:  { size: 'Raspberry', sizeEmoji: '🫐', development: 'Fingers and toes are webbing. Baby\'s heart beats ~150 times per minute.', nutrition: 'Eat small frequent meals to combat nausea. Ginger tea helps. Stay hydrated.', activity: 'Gentle yoga and swimming are safe. Rest when needed — fatigue is normal.' },
  12: { size: 'Lime', sizeEmoji: '🍋', development: 'All major organs are formed. Baby can yawn and suck their thumb!', nutrition: 'Increase protein intake. Lentils, eggs, paneer are excellent sources.', activity: 'Prenatal yoga improves flexibility. 30 min walks daily are beneficial.' },
  16: { size: 'Avocado', sizeEmoji: '🥑', development: 'Baby can hear sounds and make facial expressions. Eyes move side to side.', nutrition: 'Iron needs increase — eat spinach, fortified cereals, rajma. Pair with Vitamin C.', activity: 'Swimming is excellent at this stage. Avoid lying flat on back for long periods.' },
  20: { size: 'Banana', sizeEmoji: '🍌', development: 'Baby is around 25cm long. Kicks are becoming more frequent and stronger.', nutrition: 'Calcium is critical — dairy, ragi, sesame seeds (til). 1000mg/day recommended by IAP.', activity: 'Kegel exercises strengthen pelvic floor. Prenatal pilates is excellent.' },
  24: { size: 'Corn', sizeEmoji: '🌽', development: 'Baby\'s brain develops rapidly. Lungs are developing air sacs (viable outside womb).', nutrition: 'Omega-3 fatty acids support brain development — walnuts, flaxseeds, fatty fish.', activity: 'Light strength training with guidance is safe. Avoid contact sports.' },
  28: { size: 'Eggplant', sizeEmoji: '🍆', development: 'Baby can open their eyes! REM sleep cycles start — baby may dream.', nutrition: 'Third trimester calorie needs increase ~300 cal/day. Iron supplements if prescribed.', activity: 'Reduce high-impact exercise. Water aerobics are ideal. Rest with left side elevation.' },
  32: { size: 'Squash', sizeEmoji: '🥦', development: 'Baby is practising breathing movements. Gaining about 250g per week now.', nutrition: 'Small frequent meals as stomach is compressed. Heartburn common — avoid spicy food.', activity: 'Gentle stretching and breathing exercises. Prepare for labour with perineal massage.' },
  36: { size: 'Head of lettuce', sizeEmoji: '🥬', development: 'Baby is dropping into position. Lungs nearly mature. Gaining final fat stores.', nutrition: 'Stay hydrated. Dates consumption from 36 weeks may help cervical ripening (per some studies).', activity: 'Birth ball exercises, walking, and stair climbing can encourage engagement.' },
  40: { size: 'Pumpkin', sizeEmoji: '🎃', development: 'Full term! Baby is ready. Head circumference ~35cm, weight ~3.2–3.6kg typically.', nutrition: 'Stay hydrated. Light, easily digestible foods. Prepare hospital bag snacks.', activity: 'Light walking encourages labour. Rest when possible. Trust your body.' },
}

function getWeekData(week: number) {
  const keys = Object.keys(WEEK_DATA).map(Number).sort((a, b) => a - b)
  let closest = keys[0]
  for (const k of keys) { if (k <= week) closest = k }
  return WEEK_DATA[closest]
}

const TABS = ['👶 Baby', '🥗 Nutrition', '🏃 Activity']

export default function PregnancyPage() {
  const { baby, weeksPregnant, weeksUntilDue } = useBaby()
  const [week, setWeek] = useState(weeksPregnant || 12)
  const [tab, setTab] = useState('👶 Baby')

  const data = getWeekData(week)
  const trimester = week <= 12 ? 1 : week <= 27 ? 2 : 3

  return (
    <div>
      <AppBar title="Pregnancy Tracker" showBack />

      {/* Week navigator */}
      <div style={{ background: 'linear-gradient(135deg, #FCE7F3 0%, #EDE9F8 100%)', padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button
            onClick={() => setWeek(w => Math.max(4, w - 1))}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={20} color="#9B8EC4" />
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#9B8EC4' }}>WEEK</p>
            <p style={{ fontSize: 48, fontWeight: 800, color: '#2D2D3A', lineHeight: 1 }}>{week}</p>
            <p style={{ fontSize: 12, color: '#6B6B7B', marginTop: 4 }}>Trimester {trimester} · {weeksUntilDue > 0 ? `${weeksUntilDue}w left` : 'Due now!'}</p>
          </div>

          <button
            onClick={() => setWeek(w => Math.min(42, w + 1))}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={20} color="#9B8EC4" />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999,
            background: 'linear-gradient(90deg, #F9A8D4, #9B8EC4)',
            width: `${Math.min(100, (week / 40) * 100)}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Size comparison */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, background: 'rgba(255,255,255,0.6)', borderRadius: 14, padding: '12px 16px' }}>
          <span style={{ fontSize: 36 }}>{data.sizeEmoji}</span>
          <div>
            <p style={{ fontSize: 12, color: '#9B8EC4', fontWeight: 700 }}>BABY&apos;S SIZE</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#2D2D3A' }}>{data.size}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`pill-tab ${tab === t ? 'active' : ''}`}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '16px 16px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1.5px solid #EBEBF0' }}>
          <p style={{ fontSize: 15, color: '#2D2D3A', lineHeight: 1.6 }}>
            {tab === '👶 Baby' ? data.development
             : tab === '🥗 Nutrition' ? data.nutrition
             : data.activity}
          </p>
          <p style={{ fontSize: 11, color: '#9B8EC4', marginTop: 16, fontStyle: 'italic' }}>
            Source: WHO · NHS · IAP · Always consult your gynaecologist.
          </p>
        </div>

        {/* Checklist shortcuts */}
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#2D2D3A', margin: '20px 0 12px' }}>Preparation Checklists</h2>
        {[
          { emoji: '🧳', title: 'Hospital Bag', desc: 'Mum · Baby · Partner items', done: false },
          { emoji: '🛏️', title: 'Nursery Setup', desc: 'Cot, pram, car seat, monitor', done: false },
          { emoji: '🍼', title: 'Feeding Prep', desc: 'Breast pump, bottles, nursing bra', done: false },
          { emoji: '🏥', title: 'Medical Prep', desc: 'Paediatrician, birth plan, vaccines', done: false },
        ].map(item => (
          <div key={item.title} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'white', borderRadius: 16, padding: '14px 16px', marginBottom: 8,
            border: '1.5px solid #EBEBF0',
          }}>
            <span style={{ fontSize: 24 }}>{item.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2D2D3A' }}>{item.title}</p>
              <p style={{ fontSize: 12, color: '#6B6B7B', marginTop: 2 }}>{item.desc}</p>
            </div>
            <ChevronRightIcon size={16} color="#9B8EC4" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ChevronRightIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}
