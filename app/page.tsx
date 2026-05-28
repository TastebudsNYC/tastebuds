import { PublicLandingPage } from '@/components/public/PublicLandingPage'
import { getPublicLandingTableCards } from '@/lib/app/public-landing'

export default async function Home() {
  const tableCards = await getPublicLandingTableCards()

  return <PublicLandingPage tableCards={tableCards} />
}
