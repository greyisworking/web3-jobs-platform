export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_image: string | null
  author_id: string | null
  author_name: string
  author_address: string | null
  author_ens: string | null
  tags: string[] | null
  reading_time: number
  is_minted: boolean
  mint_contract: string | null
  mint_token_id: string | null
  collect_count: number
  tip_amount: number
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
  tags: string[]
  published: boolean
}

export interface ArticleCollector {
  id: string
  article_id: string
  collector_address: string
  collector_ens: string | null
  amount: number
  tx_hash: string | null
  collected_at: string
}

export interface ArticleRemix {
  id: string
  original_article_id: string
  remix_article_id: string
  created_at: string
}
