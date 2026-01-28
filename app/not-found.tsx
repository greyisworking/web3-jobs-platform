import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sub-offwhite dark:bg-sub-dark-bg flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-[120px] md:text-[160px] font-heading leading-none text-sub-hotpink select-none mb-8">
          404
        </h1>

        <p className="text-xl md:text-2xl font-semibold text-sub-charcoal dark:text-gray-200 mb-3">
          찾으시는 공고가 블록체인 너머로 사라졌습니다
        </p>
        <p className="text-sub-muted dark:text-gray-400 mb-8">
          요청하신 페이지를 찾을 수 없습니다. 주소를 확인하거나 홈으로 돌아가주세요.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-sub-hotpink text-white font-heading uppercase tracking-widest hover:bg-sub-hotpink/80 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
