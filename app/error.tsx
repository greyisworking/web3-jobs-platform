'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-sub-offwhite dark:bg-sub-dark-bg flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 flex items-center justify-center bg-sub-red/20 border border-sub-red/30">
            <span className="text-4xl text-sub-red font-heading">!</span>
          </div>
        </div>

        <p className="text-xl md:text-2xl font-semibold text-sub-charcoal dark:text-gray-200 mb-3">
          노드 연결에 실패했습니다
        </p>
        <p className="text-sub-muted dark:text-gray-400 mb-8">
          잠시 후 다시 시도해주세요.
        </p>

        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-sub-hotpink text-white font-heading uppercase tracking-widest hover:bg-sub-hotpink/80 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
