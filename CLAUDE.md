# Genova — 개발 지침 (CLAUDE.md)

## 프로젝트 개요

Genova는 AI 생성 영상 전문 스트리밍 플랫폼이야.

- **슬로건**: The Home of AI Filmmakers
- **스택**: Next.js 15 + Tailwind CSS + Supabase + Mux + Vercel
- **경로**: `C:\Users\Home\Desktop\genova`
- **배포**: Vercel (`genova-silk.vercel.app`)

---

## 기술 스택 규칙

### Next.js

- App Router 사용 (`src/app/`)
- Server Component 기본, 클라이언트 상태 필요시만 `"use client"`
- Server Actions: `src/app/actions/` 폴더에 위치
- 페이지 데이터 fetch는 서버 컴포넌트에서 처리

### Supabase

- 서버: `createServerSupabaseClient()` from `@/lib/supabase/server`
- 브라우저: `getBrowserSupabaseClient()` from `@/lib/supabase/browser`
- RLS 정책 항상 확인 후 쿼리 작성
- `select("*")` 사용 가능, 새 컬럼 추가 시 반드시 SQL로 ALTER TABLE

### Mux (영상 호스팅)

- Continue Watching: `setCurrentTime()` 사용
- Vimeo는 더 이상 사용하지 않음 (완전 Mux 전환됨)

### Tailwind CSS

- 커스텀 색상은 인라인 style로 처리 (`style={{ color: "#534AB7" }}`)
- Tailwind 클래스와 인라인 style 혼용 가능
- `cn()` 유틸 사용: `@/lib/utils/cn`

---

## 브랜드 시스템

### 컬러 팔레트

```
배경:     #080618 (base), #06040f (sections)
보라 계열: #26215C → #3C3489 → #534AB7 (core) → #7F77DD → #AFA9EC → #EEEDFE
흰색:     #F8F7FF
```

### 타이포그래피

- 영문: Inter
- 한글: Pretendard (CDN: jsdelivr)
- 폰트 스무딩: `WebkitFontSmoothing: "antialiased"`

### 디자인 원칙

- Netflix × Vimeo × A24 스타일 참고
- 어두운 배경 기반, 퍼플 포인트 컬러
- 여백 넉넉하게, 타이포그래피 중심
- 섹션별 글로우 blob 효과
- 카드 hover: scale + border glow 애니메이션
- 배너: `-mt-16`으로 navbar 뒤까지 확장

---

## 폴더 구조

```
src/
├── app/                    # 페이지 및 API
│   ├── actions/            # Server Actions
│   ├── competition/        # 공모전 페이지
│   ├── films/              # 영화 페이지
│   └── ...
├── components/
│   ├── genova/             # 공통 컴포넌트 (navbar, sidebar 등)
│   ├── competition/        # 공모전 관련
│   ├── films/              # 영화 관련
│   ├── video/              # 영상 시청
│   ├── admin/              # 어드민
│   └── ...
├── lib/
│   ├── queries.ts          # 공통 DB 쿼리
│   ├── queries/            # 도메인별 쿼리
│   ├── supabase/           # Supabase 클라이언트
│   ├── i18n/               # 다국어 (en/ko/ja)
│   └── constants/          # 장르 등 상수
```

---

## 주요 컴포넌트


| 컴포넌트              | 경로                                                         | 설명         |
| ----------------- | ---------------------------------------------------------- | ---------- |
| Navbar            | `src/components/genova/navbar.tsx`                         | 투명 상단 바    |
| Sidebar           | `src/components/genova/genre-sidebar.tsx`                  | 좌측 장르 사이드바 |
| HeroBanner (홈)    | `src/components/genova/home-page-client.tsx`               | 홈 히어로      |
| HeroBanner (영화)   | `src/components/films/films-page-client.tsx`               | 영화 히어로     |
| HeroBanner (공모전)  | `src/components/competition/competition-hero.tsx`          | 공모전 히어로    |
| CompetitionDetail | `src/components/competition/competition-detail-client.tsx` | 공모전 상세     |
| VideoCard         | `src/components/genova/video-card.tsx`                     | 영상 카드      |


---

## i18n 시스템

- 기본 언어: 영어 (English)
- 지원 언어: `en` / `ko` / `ja`
- 번역 파일:
  - `src/lib/i18n/translations.ts` — 영어 기본값
  - `src/lib/i18n/ko-overrides.ts` — 한국어
  - `src/lib/i18n/ja-overrides.ts` — 일본어
- 사용법: `const { t, locale } = useI18n()`
- 다국어 DB 컬럼 패턴: `title_ko`, `title_en`, `title_ja`

---

## DB 스키마 주요 테이블

### competitions

```
id, title, title_ko, title_en, title_ja,
genre, status, deadline, vote_end,
prize_info, prize_info_ko, prize_info_en, prize_info_ja,
prize_grand, prize_excellence, prize_merit, prize_audience, prize_audience_count,
concept, concept_ko, concept_en, concept_ja,
rules, rules_ko, rules_en, rules_ja,
eligibility, eligibility_ko, eligibility_en, eligibility_ja,
judging_criteria, judging_criteria_ko, judging_criteria_en, judging_criteria_ja,
submission_guidelines, submission_guidelines_ko, submission_guidelines_en, submission_guidelines_ja,
announcement, announcement_ko, announcement_en, announcement_ja,
sponsor, thumbnail_url, banner_url,
exchange_rate_usd_krw, exchange_rate_usd_jpy, base_currency,
start_date, template_url
```

### videos

```
id, title, thumbnail_url, mux_asset_id, mux_playback_id,
genre, sub_genre, purpose, tags, ai_tools,
series_name, episode_number, view_count, visibility,
uploaded_by, creator_id, is_original, is_finalist, award, runtime, description
```

---

## 코딩 컨벤션

### 컴포넌트 작성

```tsx
// Server Component (기본)
export default async function Page() { ... }

// Client Component
"use client";
export function MyComponent() { ... }
```

### Server Action 패턴

```tsx
"use server";
export async function myAction(data: FormData): Promise<Result> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Config error" };
  // ...
  revalidatePath("/path");
  return { ok: true };
}
```

### 스타일 패턴

```tsx
// 그라데이션 텍스트
<h1
  className="bg-clip-text text-transparent"
  style={{ backgroundImage: "linear-gradient(135deg, #fff 0%, #AFA9EC 100%)" }}
>

// 카드 글로우 효과
<div
  className="rounded-2xl border"
  style={{
    border: "1px solid rgba(127,119,221,0.18)",
    background: "linear-gradient(160deg, rgba(16,12,32,0.92) 0%, rgba(8,6,20,0.96) 100%)",
    boxShadow: "0 0 30px rgba(83,74,183,0.08), inset 0 1px 0 rgba(127,119,221,0.15)",
  }}
>
```

---

## 주의사항

1. **Mux 전환 완료** — Vimeo 코드 수정 금지
2. **베타 2 오픈 시** — Films 페이지 Series/Award Winners 섹션을 상단으로, 사이드바에 메뉴 추가
3. **번역은 나중에** — 현재 한국어로만 개발, 추후 일괄 번역
4. **같은 문제 두 번 반복** — 파일 직접 읽어서 코드 확인 후 해결
5. **DB 컬럼 추가 시** — 반드시 Supabase SQL Editor에서 ALTER TABLE 실행
6. **schema cache 오류** — `NOTIFY pgrst, 'reload schema';` 실행 후 서버 재시작

