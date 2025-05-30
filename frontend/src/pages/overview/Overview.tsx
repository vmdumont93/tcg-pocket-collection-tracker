import NumberFilter from '@/components/NumberFilter'
import RarityFilter from '@/components/RarityFilter.tsx'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTitle } from '@/components/ui/alert.tsx'
import * as CardsDB from '@/lib/CardsDB.ts'
import { CollectionContext } from '@/lib/context/CollectionContext'
import { GradientCard } from '@/pages/overview/components/GradientCard.tsx'
import type { Rarity } from '@/types'
import { Heart, Siren } from 'lucide-react'
import { use, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExpansionOverview } from './components/ExpansionOverview'

interface Pack {
  packName: string
  percentage: number
  fill: string
}

function Overview() {
  const { ownedCards } = use(CollectionContext)
  const { t } = useTranslation('pages/overview')

  const [highestProbabilityPack, setHighestProbabilityPack] = useState<Pack | undefined>()
  const [collectionCount, setCollectionCount] = useState('')
  const [usersCount, setUsersCount] = useState('')

  const ownedCardsCount = useMemo(() => ownedCards.reduce((total, card) => total + card.amount_owned, 0), [ownedCards])

  const [rarityFilter, setRarityFilter] = useState<Rarity[]>(() => {
    const savedRarityFilter = localStorage.getItem('rarityFilter')
    return savedRarityFilter ? JSON.parse(savedRarityFilter) : []
  })
  const [numberFilter, setNumberFilter] = useState(() => {
    const savedNumberFilter = localStorage.getItem('numberFilter')
    return savedNumberFilter ? Number.parseInt(savedNumberFilter) : 1
  })

  const totalUniqueCards = CardsDB.getTotalNrOfCards({ rarityFilter })

  useEffect(() => {
    fetch('https://vcwloujmsjuacqpwthee.supabase.co/storage/v1/object/public/stats/stats.json')
      .then((response) => response.json())
      .then((data) => {
        setCollectionCount(data.collectionCount)
        setUsersCount(data.usersCount)
      })
  }, [])

  useEffect(() => {
    localStorage.setItem('rarityFilter', JSON.stringify(rarityFilter))
    localStorage.setItem('numberFilter', numberFilter.toString())
  }, [rarityFilter, numberFilter])

  useEffect(() => {
    let newHighestProbabilityPack: Pack | undefined
    const filteredExpansions = CardsDB.expansions.filter((expansion) => !expansion.promo)
    for (const expansion of filteredExpansions) {
      const pullRates = expansion.packs
        .filter((p) => p.name !== 'Every pack')
        .map((pack) => ({
          packName: pack.name.replace(' pack', ''),
          percentage: CardsDB.pullRate({ ownedCards, expansion, pack, rarityFilter, numberFilter }),
          fill: pack.color,
        }))
      const highestProbabilityPackCandidate = pullRates.sort((a, b) => b.percentage - a.percentage)[0]
      if (highestProbabilityPackCandidate.percentage > (newHighestProbabilityPack?.percentage || 0)) {
        newHighestProbabilityPack = highestProbabilityPackCandidate
      }
    }

    setHighestProbabilityPack(newHighestProbabilityPack)
  }, [ownedCards, rarityFilter, numberFilter])

  return (
    <main className="fade-in-up">
      <article className="mx-auto max-w-7xl px-8">
        {ownedCards.length === 0 && (
          <Alert className="mb-8 border-2 border-slate-600 shadow-none">
            <Siren className="h-4 w-4" />
            <AlertTitle>{t('dontHaveCards.title')}</AlertTitle>
            <AlertDescription>{t('dontHaveCards.description')}</AlertDescription>
          </Alert>
        )}

        {ownedCards.length > 0 && (
          <Alert className="mb-8 border-2 border-slate-600 shadow-none">
            <Heart className="h-4 w-4" />
            <AlertTitle>{t('stats.title')}</AlertTitle>
            <AlertDescription>{t('stats.description', { usersCount, collectionCount })}</AlertDescription>
          </Alert>
        )}

        <div className="mb-8 flex items-center gap-2">
          <RarityFilter rarityFilter={rarityFilter} setRarityFilter={setRarityFilter} />
          <NumberFilter numberFilter={numberFilter} setNumberFilter={setNumberFilter} options={[1, 2, 3, 4, 5]} />
        </div>

        <section className="grid grid-cols-8 gap-6">
          <div className="col-span-8 flex h-full w-full flex-col items-center justify-center rounded-4xl border-2 border-slate-600 border-solid p-4 sm:p-8 md:col-span-2">
            <h2 className="mb-2 text-center text-lg sm:text-2xl">{t('youHave')}</h2>
            <h1 className="mb-3 text-balance text-center font-semibold text-3xl sm:text-7xl">
              {CardsDB.getNrOfCardsOwned({ ownedCards, rarityFilter, numberFilter })}
            </h1>
            <h2 className="text-balance text-center text-lg sm:text-2xl">{t('uniqueCards', { totalUniqueCards: totalUniqueCards })}</h2>
            <h2 className="text-balance text-center text-md sm:text-lg">
              {numberFilter === 1 ? t('numberOfCopies-single') : t('numberOfCopies-plural', { numberFilter: numberFilter })}
            </h2>
          </div>
          <GradientCard
            title={highestProbabilityPack?.packName || ''}
            packNames={t('all')}
            percentage={highestProbabilityPack?.percentage || 0}
            className="col-span-8 md:col-span-4 col-start-1 md:col-start-3"
            backgroundColor={highestProbabilityPack?.fill}
          />
          <div className="col-span-8 flex h-full w-full flex-col items-center justify-center rounded-4xl border-2 border-slate-600 border-solid p-4 sm:p-8 md:col-span-2">
            <h2 className="mb-2 text-center text-lg sm:text-2xl">{t('youHave')}</h2>
            <h1 className="mb-3 text-balance text-center font-semibold text-3xl sm:text-7xl">{ownedCardsCount}</h1>
            <h2 className="text-balance text-center text-lg sm:text-2xl">{t('cardsTotal')}</h2>
          </div>
        </section>
      </article>
      <article className="mx-auto min-h-screen max-w-7xl sm:p-6 p-0 pt-6 grid grid-cols-8 gap-6">
        {CardsDB.expansions.map((expansion) => (
          <ExpansionOverview key={expansion.id} expansion={expansion} rarityFilter={rarityFilter} numberFilter={numberFilter} />
        ))}
      </article>
    </main>
  )
}

export default Overview
