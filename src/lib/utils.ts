import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAgeInWeeks(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7))
}

export function getAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  return Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()))
}

export function getAgeDisplay(birthDate: string): string {
  const weeks = getAgeInWeeks(birthDate)
  const months = getAgeInMonths(birthDate)
  if (weeks < 8) return `${weeks} week${weeks !== 1 ? 's' : ''} old`
  if (months < 24) return `${months} month${months !== 1 ? 's' : ''} old`
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  return remMonths === 0 ? `${years} year${years !== 1 ? 's' : ''} old` : `${years}y ${remMonths}m old`
}

export function getWeeksUntilDue(dueDate: string): number {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7))
}

export function getWeeksPregnant(dueDate: string): number {
  return Math.max(0, 40 - getWeeksUntilDue(dueDate))
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (dDay.getTime() === today.getTime()) return 'Today'
  if (dDay.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function timeSince(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`
  return formatDate(d)
}

export function durationDisplay(startedAt: string, endedAt: string): string {
  const mins = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem === 0 ? `${hrs}h` : `${hrs}h ${rem}m`
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${name}! 🌸`
  if (hour < 17) return `Good afternoon, ${name}! ☀️`
  return `Good evening, ${name}! 🌙`
}

export function buildAmazonUrl(searchTerm: string): string {
  return `https://www.amazon.in/s?k=${encodeURIComponent(searchTerm)}`
}

export function buildFlipkartUrl(searchTerm: string): string {
  return `https://www.flipkart.com/search?q=${encodeURIComponent(searchTerm)}`
}

export function buildFirstCryUrl(searchTerm: string): string {
  return `https://www.firstcry.com/search?q=${encodeURIComponent(searchTerm)}`
}
