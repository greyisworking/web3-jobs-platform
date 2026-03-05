import Footer from '@/app/components/Footer'
import CareerQuiz from './CareerQuiz'

export const revalidate = 3600

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-a24-bg dark:bg-a24-dark-bg">
      <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-10">
        <CareerQuiz />
      </main>
      <Footer />
    </div>
  )
}
