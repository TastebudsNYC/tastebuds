const NEW_YORK_TIMEZONE = 'America/New_York'

export function getCurrentDateKeyInNewYork(reference: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: NEW_YORK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reference)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Failed to derive New York campaign date.')
  }

  return `${year}-${month}-${day}`
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map((value) => Number.parseInt(value, 10))

  if (!year || !month || !day) {
    throw new Error(`Invalid date key: ${dateKey}`)
  }

  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12))

  return shifted.toISOString().slice(0, 10)
}

export function getDefaultCampaignStartDate(reference: Date = new Date()) {
  return getCurrentDateKeyInNewYork(reference)
}

export function getDefaultCampaignEndDate(reference: Date = new Date(), daysAhead: number = 14) {
  return addDaysToDateKey(getCurrentDateKeyInNewYork(reference), daysAhead)
}
