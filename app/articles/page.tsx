import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Articles — Neun',
  description: 'Insights and articles about Web3 careers, blockchain industry trends, and more.',
}

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-5xl md:text-6xl font-heading uppercase tracking-[0.1em] text-a24-text dark:text-a24-dark-text mb-4">
          Articles
        </h1>
        <p className="text-sm text-a24-muted dark:text-a24-dark-muted mb-16">
          Web3 커리어와 블록체인 산업에 대한 인사이트를 공유합니다.
        </p>

        <div className="py-20 text-center border-t border-b border-a24-border dark:border-a24-dark-border">
          <p className="text-4xl font-heading text-a24-text dark:text-a24-dark-text mb-4">
            COMING SOON
          </p>
          <p className="text-sm text-a24-muted dark:text-a24-dark-muted">
            곧 다양한 아티클로 찾아뵙겠습니다.
          </p>
        </div>
      </main>
    </div>
  )
}
