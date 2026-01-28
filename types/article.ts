export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_image: string | null
  author_id: string | null
  author_name: string
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  view_count: number
}

export interface ArticleFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  published: boolean
}
