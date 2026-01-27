# 🚀 설치 및 실행 가이드

## 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn

## 단계별 설치

### 1️⃣ 프로젝트 다운로드

이 폴더를 맥북에 복사하세요.

### 2️⃣ 의존성 설치

터미널에서 프로젝트 폴더로 이동 후:

```bash
npm install
```

또는

```bash
yarn install
```

### 3️⃣ 데이터베이스 초기화

```bash
npx prisma db push
```

이 명령어는 SQLite 데이터베이스를 생성하고 스키마를 적용합니다.

### 4️⃣ 첫 크롤링 실행

```bash
npm run crawl
```

3개 사이트(web3.career, Web3Jobs, Web3 KR Jobs)에서 데이터를 수집합니다.

### 5️⃣ 개발 서버 시작

```bash
npm run dev
```

브라우저에서 http://localhost:3000 열기

## 🎯 주요 명령어

```bash
# 개발 서버 (Hot Reload)
npm run dev

# 크롤링 실행
npm run crawl

# 데이터베이스 GUI (Prisma Studio)
npm run db:studio

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

## 📊 데이터베이스 관리

### Prisma Studio로 데이터 확인

```bash
npm run db:studio
```

브라우저에서 http://localhost:5555 열림

### 데이터베이스 리셋

```bash
rm prisma/dev.db
npx prisma db push
npm run crawl
```

## 🔧 문제 해결

### 포트가 이미 사용 중인 경우

```bash
# 3000 포트 대신 다른 포트 사용
npm run dev -- -p 3001
```

### node_modules 재설치

```bash
rm -rf node_modules package-lock.json
npm install
```

### Prisma 클라이언트 재생성

```bash
npx prisma generate
```

## 🌐 배포 (선택사항)

### Vercel 배포

1. Vercel 계정 생성
2. GitHub에 코드 푸시
3. Vercel에서 프로젝트 import
4. 환경 변수 설정:
   - DATABASE_URL (PostgreSQL 사용 권장)

### Railway 배포

1. Railway 계정 생성
2. PostgreSQL 플러그인 추가
3. 프로젝트 연결
4. 자동 배포

## 💡 팁

- 크롤링은 매일 1-2회 실행 권장
- 큰 사이트는 Rate Limiting 주의
- robots.txt 확인 필수
- 데이터베이스는 주기적으로 백업

## 📞 도움이 필요하신가요?

README.md를 참고하거나 GitHub Issues에 질문을 올려주세요!
