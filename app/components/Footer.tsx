export default function Footer() {
  return (
    <footer className="border-t border-a24-border dark:border-a24-dark-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col items-center text-center space-y-4">
          <span className="text-sm font-extralight uppercase tracking-[0.5em] text-a24-text dark:text-a24-dark-text">
            N E U N
          </span>
          <div className="space-y-1">
            <p className="text-[11px] font-light text-a24-muted dark:text-a24-dark-muted tracking-wide">
              대표 김다혜
            </p>
            <p className="text-[11px] font-light text-a24-muted dark:text-a24-dark-muted tracking-wide">
              neun@neun.io
            </p>
          </div>
          <p className="text-[10px] font-light text-a24-muted/60 dark:text-a24-dark-muted/60 tracking-[0.2em] pt-4">
            &copy; 2026 Neun. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
