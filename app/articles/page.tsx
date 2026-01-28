import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Articles — Neun',
  description: 'Insights and articles about Web3 careers, blockchain industry trends, and more.',
}

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-3xl mx-auto px-6 py-28">
        <h1 className="text-3xl md:text-4xl font-extralight uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text mb-4">
          Articles
        </h1>
        <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted mb-20 tracking-wide">
          Web3 커리어와 블록체인 산업에 대한 인사이트를 공유합니다.
        </p>

        <div className="py-24 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
          <p className="text-2xl font-extralight uppercase tracking-[0.3em] text-a24-text dark:text-a24-dark-text mb-4">
            Coming Soon
          </p>
          <p className="text-sm font-light text-a24-muted dark:text-a24-dark-muted tracking-wide">
            곧 다양한 아티클로 찾아뵙겠습니다.
          </p>
        </div>
      </main>
    </div>
  )
}
