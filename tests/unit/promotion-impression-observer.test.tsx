/** @vitest-environment jsdom */

import { render } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PromotionImpressionObserver } from '@/components/app/PromotionImpressionObserver'
import type { PromotionSourceContext } from '@/lib/advertising-attribution'

vi.mock('@/lib/advertising-attribution-client', () => ({
  trackPromotionMetric: vi.fn(),
}))

type MockObserver = {
  callback: IntersectionObserverCallback
  disconnect: ReturnType<typeof vi.fn>
  observe: ReturnType<typeof vi.fn>
}

const observers: MockObserver[] = []

describe('PromotionImpressionObserver', () => {
  beforeEach(() => {
    observers.length = 0
    vi.useFakeTimers()

    class MockIntersectionObserver {
      callback: IntersectionObserverCallback
      disconnect = vi.fn()
      observe = vi.fn()

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
        observers.push(this)
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does not count the same promoted card repeatedly after rerender', async () => {
    const onTrack = vi.fn()
    const seenKeysRef = { current: new Set<string>() }
    const source: PromotionSourceContext = {
      surface: 'restaurant_search',
      targetId: 5,
      targetType: 'restaurant',
    }

    const view = render(
      <PromotionImpressionObserver onTrack={onTrack} seenKeysRef={seenKeysRef} source={source}>
        <div>card</div>
      </PromotionImpressionObserver>
    )

    const firstObserver = observers[0]!

    await act(async () => {
      firstObserver.callback([
        {
          intersectionRatio: 0.6,
          isIntersecting: true,
        } as IntersectionObserverEntry,
      ], {} as IntersectionObserver)
      vi.advanceTimersByTime(750)
    })

    expect(onTrack).toHaveBeenCalledTimes(1)

    view.rerender(
      <PromotionImpressionObserver onTrack={onTrack} seenKeysRef={seenKeysRef} source={source}>
        <div>card rerendered</div>
      </PromotionImpressionObserver>
    )

    const secondObserver = observers[1]

    if (secondObserver) {
      await act(async () => {
        secondObserver.callback([
          {
            intersectionRatio: 0.8,
            isIntersecting: true,
          } as IntersectionObserverEntry,
        ], {} as IntersectionObserver)
        vi.advanceTimersByTime(750)
      })
    }

    expect(onTrack).toHaveBeenCalledTimes(1)
  })

  it('allows a new impression opportunity after a full page refresh with a fresh in-memory set', async () => {
    const onTrack = vi.fn()
    const source: PromotionSourceContext = {
      surface: 'event_list',
      targetId: 9,
      targetType: 'event',
    }

    const firstRender = render(
      <PromotionImpressionObserver
        onTrack={onTrack}
        seenKeysRef={{ current: new Set<string>() }}
        source={source}
      >
        <div>event card</div>
      </PromotionImpressionObserver>
    )

    await act(async () => {
      observers[0]!.callback([
        {
          intersectionRatio: 0.75,
          isIntersecting: true,
        } as IntersectionObserverEntry,
      ], {} as IntersectionObserver)
      vi.advanceTimersByTime(750)
    })

    firstRender.unmount()

    render(
      <PromotionImpressionObserver
        onTrack={onTrack}
        seenKeysRef={{ current: new Set<string>() }}
        source={source}
      >
        <div>event card refreshed</div>
      </PromotionImpressionObserver>
    )

    await act(async () => {
      observers[1]!.callback([
        {
          intersectionRatio: 0.75,
          isIntersecting: true,
        } as IntersectionObserverEntry,
      ], {} as IntersectionObserver)
      vi.advanceTimersByTime(750)
    })

    expect(onTrack).toHaveBeenCalledTimes(2)
  })
})
