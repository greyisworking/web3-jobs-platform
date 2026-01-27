/**
 * JobCard 스켈레톤 UI
 * 로딩 상태에서 실제 카드와 동일한 레이아웃으로 쉬머 효과를 표시
 */

/** 개별 스켈레톤 블록 — 쉬머 + 펄스 애니메이션 적용 */
function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-gray-200/50 via-gray-100/50 to-gray-200/50 dark:from-white/5 dark:via-white/10 dark:to-white/5 animate-pulse ${className ?? ''}`}
    />
  )
}

export default function JobCardSkeleton() {
  return (
    <div className="p-6 backdrop-blur-md bg-white/70 dark:bg-white/10 border-hairline border-white/20 rounded-xl">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 flex-1">
          {/* 아바타 플레이스홀더 */}
          <ShimmerBlock className="flex-shrink-0 w-12 h-12 rounded-xl" />

          <div className="flex-1 space-y-3">
            {/* 제목 */}
            <ShimmerBlock className="h-5 w-3/4" />
            {/* 회사명 */}
            <ShimmerBlock className="h-4 w-1/3" />
            {/* 뱃지 */}
            <div className="flex gap-2">
              <ShimmerBlock className="h-5 w-16 rounded-full" />
              <ShimmerBlock className="h-5 w-20 rounded-full" />
              <ShimmerBlock className="h-5 w-14 rounded-full" />
            </div>
            {/* 메타 태그 */}
            <div className="flex gap-2">
              <ShimmerBlock className="h-7 w-20 rounded-full" />
              <ShimmerBlock className="h-7 w-24 rounded-full" />
              <ShimmerBlock className="h-7 w-16 rounded-full" />
              <ShimmerBlock className="h-7 w-28 rounded-full" />
            </div>
          </div>
        </div>
        {/* 버튼 플레이스홀더 */}
        <ShimmerBlock className="ml-4 flex-shrink-0 w-16 h-9 rounded-lg" />
      </div>
    </div>
  )
}

/** 스켈레톤 그리드 — count개의 카드를 로딩 상태로 표시 */
export function JobCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  )
}
