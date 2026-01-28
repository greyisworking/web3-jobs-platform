'use client'

import SubpageHeader from '../components/SubpageHeader'
import Footer from '../components/Footer'

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF9] dark:bg-a24-dark-bg">
      <div className="max-w-3xl mx-auto px-6">
        <SubpageHeader title="A R T I C L E S" />
      </div>
      <main className="max-w-3xl mx-auto px-6 pb-20">
        <div className="py-24 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
          <p className="text-2xl font-extralight uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text mb-4">
            Coming Soon
          </p>
          <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted tracking-wide">
            Web3 커리어와 블록체인 산업에 대한 인사이트를 곧 공유합니다.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
