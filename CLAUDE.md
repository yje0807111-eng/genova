# Genova — 개발 지침 (CLAUDE.md)

## 프로젝트 개요

Genova는 AI 생성 영상 전문 스트리밍 플랫폼이야.

- **슬로건**: The Home of AI Filmmakers
- **스택**: Next.js 16 + Tailwind CSS 4 + Supabase + Mux + Vercel
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
- **모든 영상은 Mux 직접 업로드** (`@mux/mux-uploader-react`).
- **Vimeo 전면 제거됨** — `Video.vimeoId`, `videos.vimeo_id` 컬럼, `<WatchVideoEmbed>`, `/shorts` (Vimeo iframe primary였음) 모두 retire (commits 2945b76 / 1d98584 / 0aabad6). 어떤 형태의 Vimeo 참조도 다시 도입 금지.

### Tailwind CSS

- 커스텀 색상은 인라인 style로 처리 (`style={{ color: "#534AB7" }}`)
- Tailwind 클래스와 인라인 style 혼용 가능
- `cn()` 유틸 사용: `@/lib/utils/cn`

---

## 브랜드 시스템

### 컬러 팔레트

> 실측 분포: 홈 페이지 면적의 ~50%가 `#0a0a0a`. 가시 보라 액센트는 `#7F77DD` 중심.
> 토큰 작업 시 시맨틱 네이밍(`--accent-primary/core/light`)으로 역할 분리한다.

#### 베이스 (배경)

```
페이지 베이스:  #0a0a0a   ← body, navbar, 카드 베이스 (페이지 면적 ~50%)
페이드 전용:    #080618   ← Hero/섹션 fade 알파 그라데이션 한정 (solid 사용 금지)
사이드바 틴트:  rgba(22,14,42,…) → #0a0a0a   ← 현재 별도, 통일 검토 중
```

#### 액센트 (역할 분리)

```
--accent-primary: #7F77DD   ← 가시 액센트 (✦ 마커, 도트, 활성 보더, hover)
--accent-core:    #534AB7   ← 글로우/섀도우 알파 베이스 (rgba(83,74,183,…))
--accent-light:   #AFA9EC   ← 텍스트 액센트, 그라데이션 중간/끝 스톱
```

#### 텍스트 (5단계)

```
--text-primary:   #F8F7FF                       ← 주요 텍스트 (text-white)
--text-secondary: rgba(255,255,255,0.85)
--text-tertiary:  rgba(255,255,255,0.65)
--text-muted:     rgba(255,255,255,0.40)
--text-disabled:  rgba(255,255,255,0.25)
```

#### 보존 (현재 미사용, 향후 확장 예약)

```
#26215C, #3C3489, #EEEDFE   ← 코드 사용처 없음. 의도적 보존.
```

#### 사용 금지

```
#9d7dff   ← globals.css 레거시 (실제 브랜드 컬러 아님)
#8b5cf6   ← Tailwind violet 유출 (home-page-client.tsx 의 GenreTop10Row — 교체 필요)
```

### 버튼 시스템 (4단계)

| 단계         | 패턴            | 스타일                                                                                              | 사용 위치              |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------ | ------------------ |
| **primary**   | `btn-primary`   | 퍼플 그라데이션 `linear-gradient(135deg, #6B5FD4 0.85 → #534AB7 0.75 → #3F36A3 0.65)` + 라이트 보더 + inset highlight | Hero Play, Navbar Upload |
| **secondary** | `btn-secondary` | 솔리드 화이트 `bg-white` + 텍스트 `#0a0a0a`                                                                  | Competition Watch, 활성 탭/필터 |
| **tertiary**  | `btn-tertiary`  | 글래스 `rgba(255,255,255,0.06)` + `backdrop-blur(8px)` + `border: rgba(255,255,255,0.15)`                | More Info, Save 등 보조 |
| **icon**      | `btn-icon`      | 미니 아이콘 버튼 `rgba(255,255,255,0.04)` + `border-white/10`                                              | 캐러셀 화살표, 미니 액션 |

> 페이지네이션 도트, 텍스트 링크 등은 위 4단계 외. 새 인터랙티브 요소는 4단계 안에서 선택.

### 예외 컬러 (시스템 외, 의도적 허용)

- **Spotlight 크리에이터 배지 6색** — `home-page-client.tsx`의 `SPOTLIGHT_BADGES`. 의도된 시각적 다양성:
  - `#7F77DD` (Rising Creator) — 브랜드
  - `#f97316` (Creative Mind)
  - `#FFD700` (Top Rated)
  - `#06b6d4` (Visionary)
  - `#a855f7` (Storyteller)
  - `#ec4899` (Trendsetter)
- **시스템 빨강** — 삭제 확인 모달 등: `linear-gradient(135deg, #dc2626 → #ef4444)`
- 위 예외 외 새 컬러 도입 시 사전 검토 필요.

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
| Sidebar           | `src/components/genova/slim-sidebar.tsx`                   | 좌측 슬림 사이드바 |
| HeroBanner (홈)    | `src/components/genova/home-page-client.tsx`               | 홈 히어로 (영화 탭 포함 — `/films` 는 `/?tab=films` 로 redirect) |
| HeroBanner (공모전)  | `src/components/genova/competition-hero.tsx`               | 공모전 히어로    |
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

1. **모든 영상은 Mux 전용** — Vimeo 코드/필드/컬럼/`/shorts` 라우트 전수 제거됨. 새 Vimeo 참조 도입 금지.
2. **베타 2 오픈 시** — Films 페이지 Series/Award Winners 섹션을 상단으로, 사이드바에 메뉴 추가
3. **다국어 — 영어 기본값 + ko/ja overrides** — `translations.ts`(en) → `ko-overrides.ts` / `ja-overrides.ts` 순서로 fallback. 신규 키는 영어 기본값 먼저 추가, 한일 번역은 점진적
4. **같은 문제 두 번 반복** — 파일 직접 읽어서 코드 확인 후 해결
5. **DB 컬럼 추가 시** — 반드시 Supabase SQL Editor에서 ALTER TABLE 실행
6. **schema cache 오류** — `NOTIFY pgrst, 'reload schema';` 실행 후 서버 재시작

