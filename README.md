# Genova

AI 영상 스트리밍/공모전 서비스 예제 프로젝트입니다.

- Next.js App Router
- Supabase(Auth, Database, Storage, RLS)
- 영상 업로드/수정, 프로필, 팔로우, 댓글/좋아요/저장
- 공모전/결선/수상작, 알림, 관리자 페이지

## 로컬 실행 방법

### 1) 의존성 설치

```bash
npm install
```

### 2) 환경변수 설정

프로젝트 루트에 `.env.local` 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ADMIN_EMAILS=
```

### 3) Supabase 마이그레이션 반영

```bash
npx supabase db push
```

### 4) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

---

## 환경변수 목록

### 필수

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key

### 운영(권장)

- `ADMIN_EMAILS`: 관리자 이메일 목록 (콤마 구분)
  - 예: `admin@example.com,ops@example.com`
  - `/admin` 접근 제어에 사용

---

## Supabase 마이그레이션 순서

아래 파일 순서대로 적용됩니다(파일명 timestamp 기준):

1. `20260413000000_votes_unique_and_rls.sql`
2. `20260413140000_profiles_follows_saved_storage.sql`
3. `20260413160000_videos_visibility_thumbnails_rls.sql`
4. `20260413190000_videos_purpose_sub_genre.sql`
5. `20260413200000_videos_tags_series.sql`
6. `20260413210000_likes_comments_engagement.sql`
7. `20260413220000_videos_view_count.sql`
8. `20260413230000_videos_columns.sql`
9. `20260413240000_upload_rls_profiles_storage_videos.sql`
10. `20260414090000_notifications.sql`

적용 명령:

```bash
npx supabase db push
```

---

## 관리자 설정 방법

1. `.env.local` 또는 Vercel 환경변수에 `ADMIN_EMAILS` 설정
2. 해당 이메일 계정으로 로그인
3. `/admin` 접속

`/admin`에서 가능한 작업:

- 공모전 생성
- 공모전 상태 관리
- 영상 결선 지정/해제
- 수상명 지정/해제

---

## Vercel 배포 방법

프로젝트에 `vercel.json`이 포함되어 있습니다.

### 1) Vercel 프로젝트 연결

- GitHub 저장소를 Vercel에 Import
- Framework는 Next.js 자동 인식

### 2) 환경변수 설정 (Vercel Project Settings → Environment Variables)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_EMAILS`

### 3) 배포

- `main` 브랜치 push 시 자동 배포
- 또는 Vercel 대시보드에서 Deploy

---

## 참고

- 썸네일 업로드는 Supabase Storage `thumbnails` 버킷 사용
- 조회수는 `watch/[id]` 진입 시 RPC(`increment_video_view_count`)로 증가
- 알림은 `notifications` 테이블 기반으로 동작
