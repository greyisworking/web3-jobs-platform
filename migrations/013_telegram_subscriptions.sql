-- Telegram keyword subscriptions for job alerts
CREATE TABLE IF NOT EXISTS "TelegramSubscription" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "chatId" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "keywordRaw" TEXT NOT NULL,
  "lastNotifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TelegramSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TelegramSubscription_chatId_keyword_key"
  ON "TelegramSubscription"("chatId", "keyword");
CREATE INDEX IF NOT EXISTS "TelegramSubscription_chatId_idx"
  ON "TelegramSubscription"("chatId");
CREATE INDEX IF NOT EXISTS "TelegramSubscription_keyword_idx"
  ON "TelegramSubscription"("keyword");
