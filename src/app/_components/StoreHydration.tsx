'use client'

/**
 * Zustand persist の skipHydration: true に対応した手動ハイドレーションコンポーネント。
 * layout.tsx（Server Component）から子コンポーネントとして配置することで、
 * ページマウント後に localStorage からストアを復元する。
 */

import { useEffect } from 'react'
import { useOnboardingStore } from '@/store/useOnboardingStore'

export function StoreHydration() {
  useEffect(() => {
    // ブラウザマウント後に localStorage からストアをハイドレート
    useOnboardingStore.persist.rehydrate()
  }, [])

  // UI を持たない純粋なサイドエフェクトコンポーネント
  return null
}
