import Pixelbara from './components/Pixelbara'

export default function Loading() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg flex flex-col items-center justify-center">
      <Pixelbara pose="loading" size={120} />
      <p className="mt-4 text-sm text-a24-muted dark:text-a24-dark-muted tracking-wide">
        loading... plz wait ser
      </p>
    </div>
  )
}
