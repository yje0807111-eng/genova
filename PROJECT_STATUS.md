# Genova — Project Status

> **Last verified**: 2026-05-14
> AI 생성 영상 스트리밍 플랫폼 — *The Home of AI Filmmakers*
>
> 이 문서는 코드를 직접 검증해서 작성됨. CLAUDE.md와 차이나는 항목은 ⚠️ 로 표시.

---

## 1. 기능 현황

### ✅ 완료 / 동작 중인 기능

| 영역 | 라우트 | 핵심 컴포넌트 |
|---|---|---|
| **홈** | `/` | `home-page-client.tsx` (Hero, GenreCarousel, TabNav, Awards, 영화 탭 등 포함) |
| **영화 카탈로그** | `/?tab=films` (`/films` → redirect) | `home-page-client.tsx` (탭 통합) |
| **공모전** | `/competition`, `/competition/[id]` | `competition-list-client`, `competition-detail-client`, `featured-hero-carousel` |
| **시청** | `/watch/[id]`, `/watch` | `mux-player-client`, `watch-video-embed`, `watch-meta-sidebar`, `up-next-section`, `series-episodes-slider` |
| **업로드** | `/upload`, `/upload/edit/[id]` | `upload-video-form`, `selected-video-uploader`, Mux direct upload |
| **인증** | `/auth`, `/auth/reset-password`, `/login` | `auth-form`, `auth-nav` |
| **프로필** | `/profile`, `/profile/[id]`, `/profile/settings` | `profile-page-client` (`GenovaProfileClient`), `profile-settings-client` |
| **크리에이터** | `/creator/[id]` | `profile-page-client.tsx` (`GenovaProfileClient` 재사용) |
| **장르** | `/genre/[genre]` | (장르별 그리드) |
| **검색** | `/search` | `search-page-body`, `search-nav` |
| **댓글** | (시청 페이지 내) | `video-comments-section` |
| **알림** | `/notifications` | `notifications-list` |
| **어드민** | `/admin`, `/admin/competition/[id]` | `edit-competition-form`, `video-manage` |
| **신고** | (액션 only) | `actions/reports.ts` |
| **트로피/어워드** | (액션 + 표시) | `actions/trophies-admin.ts`, `awards-gallery.tsx`, `trophies-display.ts` |
| **크레딧/포인트** | `/credits` | `credit_transactions` 테이블 |
| **i18n** | (전역) | `language-provider`, 3개 언어 (`en/ko/ja`) |

### 🟡 부분 구현 / 진행 중

| 영역 | 상태 |
|---|---|
| `/shorts` | 라우트 존재 (`shorts/page.tsx`, `shorts-feed.tsx`) — 메뉴 노출/완성도 미확인 |
| `/business`, `/business/apply` | B2B 진입 페이지 + 폼 존재 (`business-landing-client`, `business-apply-client`) |
| `/tools/[slug]` | AI 도구 상세 페이지 (`tool-detail-client`) |
| `/landing` | 별도 랜딩 (`landing-client`) — 홈과의 역할 분리 모호 |
| `links/`, `feed/` 컴포넌트 폴더 | `links/profile-text-link.tsx`, `feed/feed-youtube-layout.tsx` — 각 1 파일. `messages/` 폴더는 비어 있음 (모든 파일 정리됨 Phase A Batch 0). |
| 시리즈/시즌 | 데이터 모델 (`series_name`, `episode_number`) + UI 일부 존재, 메뉴 미노출 |

### ⏳ 미구현 / 예정

- CLAUDE.md 언급: "베타 2 오픈 시 Films Series/Award Winners 상단 + 사이드바 메뉴 추가"
- 다국어 실제 번역 (`ko-overrides`, `ja-overrides`에 일부만 채워짐, 영어 기본값으로 폴백)
- 채팅 (`chat-drawer.tsx`는 있음, 메시지 시스템 연결 여부 불명확)

---

## 2. 기술 스택 (실측)

### Runtime / Framework

| 항목 | 버전 | 비고 |
|---|---|---|
| **Next.js** | **16.2.3** | ⚠️ CLAUDE.md는 "Next.js 15"로 기재 — 실제는 16 |
| React | 19.2.4 | |
| TypeScript | ^5 | |
| ESLint | ^9 (eslint-config-next 16.2.3) | |

> ⚠️ `AGENTS.md` 경고: "This is NOT the Next.js you know. Read `node_modules/next/dist/docs/` before writing code." — Next 16 신규 API/관례 사용 중

### 데이터 / 인프라

| 항목 | 버전 |
|---|---|
| `@supabase/ssr` | ^0.10.2 |
| `@supabase/supabase-js` | ^2.103.0 |
| `@mux/mux-node` | ^14.0.1 |
| `@mux/mux-player-react` | ^3.13.0 |
| `@mux/mux-uploader-react` | ^1.5.0 |
| `resend` (이메일) | ^6.12.3 |

### UI / 스타일

| 항목 | 버전 |
|---|---|
| **Tailwind CSS** | **^4** (CSS-first `@theme inline` 사용) |
| `@tailwindcss/postcss` | ^4 |
| `lucide-react` | ^0.544.0 |
| `sonner` (toast) | ^2.0.7 |

### 배포

- **호스팅**: Vercel — `genova-silk.vercel.app`
- **DB**: Supabase
- **CDN/영상**: Mux

---

## 3. 폴더 구조 (주요)

```
genova/
├── src/
│   ├── app/                        # App Router (28 페이지)
│   │   ├── actions/                # Server Actions (14개)
│   │   │   ├── admin.ts            comments.ts        engagement.ts
│   │   │   ├── business-inquiries.ts business.ts      competitions.ts
│   │   │   ├── notifications.ts    profile.ts         reports.ts
│   │   │   ├── trophies-admin.ts   vote.ts            video.ts
│   │   │   ├── video-progress.ts   video-views.ts
│   │   ├── api/                    # API Routes (13개)
│   │   │   ├── videos/             mux/{asset,upload,asset/delete}/
│   │   │   ├── search/{explore,suggest}/
│   │   │   ├── hashtags/{track,ranking}/
│   │   │   ├── cron/cleanup-mux/   site-settings/   check-admin/
│   │   │   ├── user-series/        watch-cookie/
│   │   ├── [25개 페이지 라우트…]
│   │
│   ├── components/
│   │   ├── genova/                 # 홈 + 공통 UI (navbar, sidebar, hero, video-card 등 22개)
│   │   ├── admin/                  ├── auth-form.tsx
│   │   ├── business/               ├── auth-nav.tsx
│   │   ├── comments/               ├── chat-drawer.tsx
│   │   ├── competition/            ├── hero-section.tsx
│   │   ├── creator/                ├── site-shell.tsx
│   │   ├── credits/                ├── video-card.tsx
│   │   ├── feed/                   └── vote-button.tsx
│   │   ├── films/
│   │   ├── landing/        links/        messages/      notifications/
│   │   ├── profile/        search/       shorts/        tools/
│   │   ├── ui/             upload/       video/
│   │
│   ├── lib/
│   │   ├── i18n/                   # en/ko/ja 번역
│   │   ├── queries/                # 도메인별 DB 쿼리
│   │   ├── supabase/               # 클라이언트 헬퍼 (server/browser)
│   │   ├── constants/              # 장르 등
│   │   ├── hashtags/               auth/        utils/      dom/
│   │   ├── migrations/             notifications.ts        types.ts
│   │   ├── queries.ts              mappers.ts              mock-data.ts
│   │   ├── trophies-display.ts     view-count.ts           tags.ts
│   │   ├── vimeo.ts                ⚠️ Vimeo 헬퍼 — CLAUDE.md "완전 Mux 전환" 주장과 불일치
│   │   └── …
│
├── supabase/
│   ├── migrations/                 # 29개 마이그레이션 (2026-04 ~ 2026-05)
│   ├── seed.sql                    # competitions, creators, videos 시드
│   ├── seed-videos.sql, seed-trophies-dummy.sql
│   └── trophies-bootstrap.sql
│
├── middleware.ts                   # Supabase 세션 갱신
├── next.config.ts                  # 이미지 remotePatterns (unsplash, pravatar, picsum, supabase)
├── CLAUDE.md                       # 개발 지침 (Claude용)
├── AGENTS.md                       # Next 16 경고
├── README.md
└── tmp-en-keys.json                ⚠️ 임시 파일 (정리 후보)
```

> Tailwind 설정은 globals.css `@theme inline` 단독 source of truth (Tailwind v4 CSS-first).
> `tailwind.config.ts` 는 Phase 2.4 에서 제거됨 (`68c1640`).

---

## 4. 디자인 시스템 현황

### 🔴 정합성 평가: **분열 상태**

토큰 정의 위치가 **3중으로 분산**돼 있고 서로 충돌함.

#### 4-1. CSS 변수 (`src/app/globals.css`)

| 토큰 | 정의값 | 비고 |
|---|---|---|
| `--background` | `#0a0a0a` | ⚠️ CLAUDE.md 기준 `#080618`와 불일치 |
| `--foreground` | `#f4f2ff` | |
| `--primary` | **`#9d7dff`** | ⚠️ CLAUDE.md 기준 `#534AB7`와 불일치 (전혀 다른 보라) |
| `--accent` | `#8b5cf6` | ⚠️ Tailwind violet, 브랜드 컬러 아님 |
| `--card`, `--muted`, `--secondary` | `#1a1a1a` | |
| `--radius` | `0.625rem` | |
| `--ring`, `--sidebar-*` | (대부분 #9d7dff 기반) | |

#### 4-2. ~~Tailwind 설정 (`tailwind.config.ts`)~~ ✅ 제거됨 (Phase 2.4 — `68c1640`)

Tailwind v4 CSS-first 전환 — JS config 자동 로드 안 됨 확인 후 dead config 제거.
당시 상태였던 `colors.genova.*` 는 사용처 0건, `fontFamily` 는 존재하지 않는 변수
(`--font-inter`, `--font-dm-sans`) 참조 중 (layout.tsx 는 실제로는 `Plus_Jakarta_Sans` + `Syne` 사용).
이후 모든 Tailwind 토큰은 `globals.css` `@theme inline` 단독으로 관리.

#### 4-3. 인라인 스타일 (압도적 다수)

```
inline `style={{...}}` 사용:  535건 / 55개 파일
```

홈 전반에서 반복되는 하드코딩 패턴:
- `rgba(127, 119, 221, 0.12/0.18/0.25/0.35/0.6)` — 보더/글로우 (5단계 알파)
- `rgba(83, 74, 183, 0.08/0.2/0.3)` — 채우기
- `rgba(8, 6, 20, 0.95/0.92/0.96)` — 표면 오버레이
- `text-white/35`, `/40`, `/55`, `/60`, `/65`, `/75`, `/85` — 텍스트 알파 **8단계** 난립

### 4-4. 정의된 유틸 클래스 (`globals.css`)

타이포 관련은 잘 정리되어 있지만 **실제 컴포넌트에서 거의 안 씀**:
- `.eyebrow`, `.page-title`, `.page-subtitle`, `.page-cinematic`
- `.text-gradient-brand`, `.text-gradient-brand-soft`
- `.btn-primary`
- `.typo-sidebar-heading/link/tag/micro`, `.typo-stat-xs`
- `.typo-card-title/author/meta`
- `.typo-overlay-duration/genre`, `.typo-filmstrip-title/progress`
- `.ui-badge-genre`
- `.gradient-border-card`, `.gradient-border-card-subtle`

### 4-5. 브랜드 가이드 (CLAUDE.md 명시)

```
배경:     #080618 (base), #06040f (sections)
보라:     #26215C → #3C3489 → #534AB7 (core) → #7F77DD → #AFA9EC → #EEEDFE
흰색:     #F8F7FF
```

> ⚠️ **`globals.css`의 `--primary: #9d7dff`는 이 가이드와 불일치.** 어느 쪽이 정답인지 확정 필요.

---

## 5. DB 스키마 요약 (Supabase)

### 5-1. 핵심 테이블 (29개 마이그레이션 기준)

| 테이블 | 주요 컬럼 | 비고 |
|---|---|---|
| `profiles` | `id (FK auth.users)`, `display_name`, `avatar_url`, `bio`, `tools[]`, `subscription_tier (free/basic/pro)`, `is_genova_partner`, `total_awards`, `banner_url`, `pinned_video_id`, `collab_*`, `creator_settings` | RLS: select all, write self |
| `videos` | `id`, `title`, `thumbnail_url`, `backdrop_url`, `vimeo_id`, `mux_asset_id`, `mux_playback_id`, `genre`, `sub_genre`, `additional_genres[]`, `purpose (personal/competition)`, `tags[]`, `ai_tools[]`, `series_name`, `episode_number`, `view_count`, `visibility (public/private)`, `is_original`, `is_finalist`, `is_competition_featured`, `award`, `runtime`, `description`, `uploaded_by`, `creator_id` | RLS 적용, hashtag 트래킹 연동 |
| `competitions` | `id`, `title`+`title_ko/en/ja`, `genre`, `status`, `deadline`, `vote_end`, `prize_info`+다국어, `prize_grand/excellence/merit/audience`, `prize_audience_count`, `concept`+다국어, `rules`+다국어, `eligibility`+다국어, `judging_criteria`+다국어, `submission_guidelines`+다국어, `announcement`+다국어, `sponsor`, `thumbnail_url`, `banner_url`, `is_featured`, `exchange_rate_usd_krw/jpy`, `base_currency`, `start_date`, `template_url` | seed.sql + 다수 ALTER |
| `votes` | `id`, `user_id`, `video_id`, `competition_id`, `created_at` | UNIQUE 제약, RLS |
| `follows` | `follower_id`, `following_id` | UNIQUE, 자기참조 금지 |
| `saved_videos` | `user_id`, `video_id` | UNIQUE |
| `user_awards` | `user_id`, `competition_title`, `award_title`, `awarded_at` | |
| `likes` | (videos용) | RLS |
| `comments` | `video_id`, `parent_id`, `is_pinned`, `pin_order` | 트리 구조 |
| `comment_likes` | | |
| `notifications` | type 포함 (`like` 등) | |
| `trophies` | bootstrap SQL 별도 존재 | |
| `credit_transactions` | 포인트/크레딧 거래 | |
| `site_settings` | 어드민용 전역 설정 | |
| `video_reports` | 신고. dedupe UNIQUE + RLS + delete policy | |
| `hashtag_stats` | 해시태그 통계 | |

### 5-2. Storage 버킷

- `avatars` (public) — 사용자별 `<uid>/...` 경로 제한

### 5-3. 트리거 / 함수

- `handle_new_user()` — auth.users insert → profiles 자동 생성
- 시청 카운트 증분 RPC (`20260505230000_watch_history_view_count_increments`)

---

## 6. 알려진 이슈 / 개선 필요

### 🔴 우선순위 높음

1. **디자인 토큰 분열** ✅ 부분 해소 (Phase 2.1~2.4)
   - ~~`globals.css --primary: #9d7dff` vs `tailwind.config.ts genova.primary: #534AB7` vs `CLAUDE.md: #534AB7`~~ → `tailwind.config.ts` 제거 (2.4). `--primary` legacy 는 보존 (Q4 결정).
   - 인라인 스타일 535건 → 토큰 시스템으로 마이그레이션 필요 (Phase 3 작업)
   - ~~텍스트 알파 8단계 난립 → 5단계 축약 합의됨~~ → 5단계 토큰 정의 완료 (2.1, `a39e677`)

2. **Vimeo 코드 잔존** ✅ 정책 확정 (CLAUDE.md 동기화됨)
   - ~~`src/lib/vimeo.ts`~~ → 제거 (K2, `fe7758b`) — extractVimeoId 사용처 0개
   - CLAUDE.md 업데이트: "Vimeo는 legacy fallback만 유지" — `Video.vimeoId` field 와 `watch-video-embed.tsx` 분기는 과거 업로드 호환용. 신규 코드에서 Vimeo 추가 금지.

3. **CLAUDE.md vs 실제 코드 불일치** ✅ 해소
   - Next.js 버전, Vimeo 정책, 다국어 정책 — 모두 동기화됨

### 🟡 우선순위 중간

4. **임시 파일 잔존** ✅ 해소
   - ~~`_head_home_page.txt`~~ → 삭제 (`f995e49`)
   - ~~`src/components/search/search-page-body.tsx.bak`~~ → 삭제 (`42f6cda`)
   - ~~`tmp-en-keys.json`~~ → 삭제됨 (root에 부재 확인 2026-05-14)

5. **다국어 미완성**
   - CLAUDE.md: "번역은 나중에, 현재 한국어로만 개발"
   - 실제: 영어가 기본값, ko/ja overrides 일부만 채워짐 → 정책 정리 필요

6. ~~**`tailwind.config.ts`의 `colors.genova.*`** — 정의는 있는데 사용 안 됨. 새 토큰 시스템과 통합하거나 제거해야 함~~ ✅ 해소 — Phase 2.4 (`68c1640`) 에서 `tailwind.config.ts` 전체 제거.

7. **mock 데이터 잔존** ✅ 정리 (K3, `59403c7`)
   - ~~`genova-mock-videos.ts`~~, ~~`profile-mock-grid-videos.ts`~~ → 제거 (사용처 0개, 5 파일 / 817줄)
   - ~~3개 dead grid 컴포넌트 (ForYouGrid, TrendingGrid, VideoGrid)~~ → 제거
   - `mock-data.ts` — **유지**. `search-queries.ts`의 production fallback (env 부재 / 빈 DB / 에러 복구).

### 🟢 우선순위 낮음

8. **부분 구현 페이지들의 노출/정책 결정**: `/shorts`, `/business`, `/tools`, `/landing` 진입점 정리

9. **컴포넌트 폴더 일관성**
   - `feed/`, `messages/`, `links/` 폴더가 어떤 페이지에 묶이는지 명시 부족
   - `src/components/genova/` (홈)와 `src/components/` 루트 컴포넌트가 섞임 (예: `hero-section.tsx`, `video-card.tsx`가 양쪽에 존재)

10. **빈 또는 미사용 코드 검증** — `chat-drawer.tsx`, `home-after-hero.tsx`, `section-reveal.tsx` 등 사용처 확인

---

## 7. 다음 할 일

### Phase A — 디자인 시스템 정합화

#### Phase 2 (완료 ✅)

- [x] **2.1** — `globals.css` `:root` 토큰 정의 (74개, Layer 1 SCALE / 2 SEMANTIC / 3 COMPOSITE) — `a39e677`
- [x] **2.2** — `@theme inline` 매핑 (35개 Tailwind 유틸 노출, semantic naming `surface/accent/fg/line/tint/danger`) — `008c37c`
- [x] **2.3** — 합성 유틸 클래스 (`@layer components` 도입, CLAUDE.md 4-tier 버튼 + `.surface-card` / `.badge-featured` 신설, 사용 0 클래스 10개 정리, `.btn-primary` 브랜드 토큰화) — `515bbb4`
- [x] **2.4** — `tailwind.config.ts` 제거 (dead config, Tailwind v4 CSS-first 정착) — `68c1640`
- [x] CLAUDE.md 컬러 팔레트 가이드 갱신 (4-tier 버튼 / 예외 컬러 / 사용 금지 명시) — `4b96058`

#### Phase 3 (완료 ✅)

- [x] **3.1** — 홈 마이그레이션용 신토큰 6개 추가 (`--sidebar-width`, `--gradient-dropdown`, `--shadow-dropdown`, `--gradient-card-overlay`, `--border-white-06/10`) — `ac34b65`
- [x] **3.2** — 합성 클래스 신설 (`.typo-hero-title`, `.typo-section-title`) — `aab7826`
- [x] **3.3** — `home-page-client.tsx` 인라인 style 33 → 25 (8개 완전 제거, 11개 토큰화, `.btn-primary` / `.btn-tertiary` 채택) — `c7a1cff`
- [x] `hero-section.tsx` dead code 삭제 — `00f7a37`

#### Phase 4 (부분 완료)

- [ ] **4.1** — 홈 잔여 인라인 25개 추가 마이그레이션 (선택 — ROI 낮음, 동적/일회성 위주)
- [x] **4.2** — Films track reference 컴포넌트 마이그레이션:
  - [x] `--gradient-row-fade-l/r` 토큰 신설 — `6cbd465`
  - [x] ~~`films-page-client.tsx`~~ (8 → 3 inline) — `09df29a` (이후 파일 삭제 — Phase A Batch 0, `b88a3d2`)
  - [x] `films/continue-watching.tsx` row-fade 채택 — `90ec804`
  - [x] `video/up-next-section.tsx` row-fade 채택 — `c06723f`
- [ ] **4.3** — 사이드바 통일 검토 (gradient `--gradient-sidebar` vs flat `--bg-base`) — **별도 세션 (시각 영향)**
- [ ] **4.4** — legacy shadcn 토큰 (`--primary` `#9d7dff` 등) 신토큰 매핑 또는 제거 — `.eyebrow` 54 사용처. **별도 세션 (시각 영향)**
- [ ] **4.5** — Q2 보류 토큰 4개 재검토 (`--tint-purple-12`, `--tint-accent-15`, `--gradient-hero-top-fade`, `--gradient-hero-bottom-fade`)

#### Phase 5 (완료 ✅)

- [x] **5.1** — competition-detail design tokens 추가 (5 토큰 + 1 합성 클래스: `--shadow-card-soft`, `--shadow-hero-glow`/`-hover`, `--gradient-card-top-accent`, `--gradient-cta-solid`, `.surface-hero-glow`) — `bea037a`
- [x] **5.2** — `competition-detail-client.tsx` 마이그레이션 (59 → 49 inline, 5개 완전 제거 + 6개 토큰화, JS hover handlers → CSS `:hover`) — `9c11770`

#### Phase 6 (완료 ✅)

- [x] **6.1** — `profile-page-client.tsx` 마이그레이션 (6 → 4 inline, P1 → `--gradient-card-overlay`, width/aspect/height Tailwind) — `4873bdb`
- [x] **6.2** — `competition/competition-hero.tsx` 마이그레이션 (24 → 21 inline, 보수적 — bespoke 패턴 다수) — `93ad259`
- [x] **6.3** — `watch-detail-client.tsx` 자동 완료 (이미 inline 0개)
- [x] **6.3.b** — watch 영역 단발성 inline 정리 (mux-player-client, recommendation-card, watch-meta-sidebar, watch-video-embed — 4 파일) — `5aff96b`
- [x] **6.4** — tail inline cleanup (video-card, series-episodes-slider, up-next-section 잔여, genova/competition-hero — 4 파일 8 변환) — `8548891`

#### Phase 4.3 (완료 ✅)

- [x] **4.3.1** — GenreSidebar 컴포넌트 dead code 삭제 (-748줄) — `fa726e2`
  - 조사 결과: `GenreSidebar`는 어디서도 import 안 됨. 실제 사이드바는 `SlimSidebar` (flat #0a0a0a + backdrop-blur). 통일은 G-E 시기에 사실상 완료된 상태.
- [x] **4.3.2** — 사이드바 그라데이션 dead 토큰 7개 제거 (-8줄, globals.css) — `2f89f0c`
  - 제거: `--sidebar-tint-top/mid/low`, `--bg-sidebar`, `--gradient-sidebar`, `--color-surface-sidebar`
  - 보존: shadcn legacy `--sidebar*` (SlimSidebar의 `bg-sidebar` 유틸 의존)

#### Phase 4.5 (완료 ✅)

- [x] **4.5.1** — `--tint-purple-12` + `--tint-accent-15` 토큰 신설 + @theme inline 매핑 (`bg-tint-purple-12`, `bg-tint-15` 유틸 생성) — `0fd7185`
- [x] **4.5.2** — 19 파일 30 사이트 sweep (`rgba(127,119,221,0.12)`, `rgba(83,74,183,0.15)` → 토큰) — `439d3d4`

#### Phase 4.1 (완료 ✅)

- [x] **4.1** — 홈 잔여 3 사이트 Tailwind 변환 (`aspect-[16/5.5]`, `bg-transparent backdrop-filter-none`, `[contain:paint]`). 나머지 22 inline 블록은 이미 토큰화/동적/bespoke — `c6cc1c7`

#### Phase 4.4 (완료 ✅)

- [x] **4.4** — legacy shadcn 토큰 5개 브랜드 align (`--primary`, `--accent`, `--ring`, `--sidebar-primary`, `--sidebar-ring`) — Tailwind violet `#9d7dff`/`#8b5cf6` → 브랜드 purple `#534AB7`/`#7F77DD`. ~75 사용처 시각 변화 (의도된 정합). 다른 legacy 토큰 (foreground/card/popover/secondary/muted/border)은 이미 neutral grays — 변경 없음 — `72d9df4`

#### Phase N (완료 ✅) — bespoke + sweep 추가 라운드

- [x] **N1** — competition-hero `--gradient-cta-hero` 신토큰 + Enter Now CTA 적용, View Rules `.btn-tertiary` 채택 — `12c7dfe`
- [x] **N3** — `--gradient-hero-top-fade`, `--gradient-hero-bottom-fade` 토큰화 (home Hero 2 사이트) — `e627aa4`
- [x] **tools/tool-detail-client** SectionHeader `.typo-section-title` + `text-accent-primary` 채택 — `178a01d`
- [x] **추가 토큰 + sweep**:
  - `--border-white-02` (26 사이트, 7 파일) — `7c756c9`
  - `--tint-accent-06`, `--tint-accent-25`, `--tint-purple-08` (32 사이트, 11 파일) — `5640675`
  - `--border-white-12` (7 사이트) — `e8e473b`
  - `--border-default` direct sweep (11 사이트, 7 파일) — `07a1995`
- [x] **합계**: 새 토큰 8 + 합성 클래스 활용. 약 **76 사이트 추가 토큰화**. 시각 0%.

#### 향후 후보 (별도 세션, ROI 작음)

- [ ] competition-hero stat pills JS hover handlers → CSS composite class (3 pills, 시각 미세 변화)
- [ ] genova/competition-hero 9개 bespoke decorative (각 1회 사용)
- [ ] 단발성 잔여 inline (대부분 동적/bespoke/계산값)
- [ ] 추가 cross-file 패턴 (rgba(255,255,255,0.05) 6사이트, rgba(0,0,0,0.5/0.6) 등) — 단발성 알파, 가치 미미

### Phase B — 문서/코드 동기화 ✅ 완료

- [x] `CLAUDE.md` 업데이트 — Next 16, Vimeo legacy, 다국어 정책 동기화
- [x] 임시 파일 정리 — `_head_home_page.txt`, `tmp-en-keys.json`, `*.bak` 모두 제거됨

### Phase C — 기능 갭 메우기

- [ ] 베타 2: Films Series/Award Winners 상단 + 사이드바 메뉴 (CLAUDE.md 명시)
- [ ] `/shorts`, `/business`, `/tools` 진입점 및 노출 정책 결정
- [ ] 다국어 실제 번역 (현재 상당수 영어 폴백)
- [ ] 트로피/어워드 표시 UI 완성도 점검

### Phase D — 검증 / 청소 (대부분 완료 ✅)

- [x] mock 데이터 vs 실 DB 분리 검증 — K3 (`59403c7`): dead mock 5개 제거, prod fallback만 보존
- [x] 사용 안 되는 컴포넌트 식별 및 제거 — K3에 포함 (ForYouGrid/TrendingGrid/VideoGrid 0 importer)
- [x] **RLS 정책 회귀 테스트** — S3 (`ce462c8` audit + 9 commit 보안 fix) — §8 참조
- [ ] Mux schema cache 이슈 (`NOTIFY pgrst, 'reload schema'`) 정기 운영 메모

---

## 8. 2026-05-14 세션 진행 사항

### K3 — Mock 데이터 정리 (`59403c7`)
- Dead mock 파일 + 컴포넌트 5개 제거 (817줄): `profile-mock-grid-videos.ts`, `genova-mock-videos.ts`, `ForYouGrid`, `TrendingGrid`, `VideoGrid`
- `mock-data.ts`는 production fallback으로 보존 (search-queries.ts에서 사용)

### S3 — RLS audit + 보안 fix (9 commits + 7 마이그레이션)
**Audit:** `docs/rls-audit.md` (`ce462c8`) — 19 테이블 perspective-별 정책 매트릭스 + 검증 SQL.

**HIGH 보안 fix (모두 라이브 DB 적용됨):**
| # | Commit | 내용 | 마이그레이션 |
|---|--------|------|-------|
| 1 | `8f9520e` | competitions admin writes → service role | `..._competitions_service_role_writes_only.sql` |
| 2 | `e1dce92` | video_reports admin SELECT/UPDATE/DELETE → service role | `..._video_reports_service_role_admin_ops.sql` |
| 3 | `689995d` | business_inquiries admin → service role | `..._business_inquiries_service_role_admin_ops.sql` |
| 4 | `426fe60` | **CRITICAL**: `POST /api/site-settings`에 admin guard 추가 + RLS 정리 (이전엔 anon이 site_settings 변조 가능) | `..._site_settings_service_role_writes_only.sql` |
| 5 | `8966341` | notifications INSERT 스푸핑 차단 (`createNotification` service role 내부화, 8 호출처 업데이트) | `..._notifications_service_role_inserts.sql` |
| 6 | `29a23d5` | videos RLS 구멍 4개 폐쇄 (`videos_select using(true)`, `videos_insert with check(true)`, 중복 delete/update 정책) + 어드민 video write 5개 service role 전환 | `..._videos_drop_overpermissive_policies.sql` |

**Profiles lockdown (phase 7a/b/c):**
- 7a (`d829941`): `public_profiles` view 생성 — 안전 컬럼 20개만 노출. credits/points/notify_*/country/updated_at 제외.
- 7b (`5e98bc7`): 30 호출처 audit + `public_profiles` 마이그레이션 (14 파일). `fetchProfileById` → `fetchOwnProfile` + `fetchPublicProfileById` 분리.
- 7c (`df4e44d`): `profiles.SELECT` 정책을 `auth.uid() = id`로 잠금. 익명/타인 직접 read 차단, view 경유만 허용.

**공용 헬퍼:** `src/lib/auth/admin-actions.ts` (`requireAdmin`, `requireAdminWithService`) — admin.ts/reports.ts/business-inquiries.ts가 공유.

**환경 세팅:**
- `SUPABASE_SERVICE_ROLE_KEY` — `.env.local` + Vercel (Production/Preview/Development) 모두 세팅 완료
- `.gitignore` `.env*` 검증됨, 트래킹 이력 없음

### P2 — `<img>` → `next/image` (5 commits, 48 sites)
- P2-1 (`ca7a015`): 정적 로고/아이콘 8개 (auth, competition, creator, series-episodes, up-next)
- P2-2 (`ad6eb8b`): 아바타 16개 (chat-drawer, comments, search, navbar, video-card, shorts, profile-settings, share-modal, watch-meta-sidebar)
- P2-3 (`ad138a8`): 공유 `video-card.tsx` 썸네일 (1)
- P2-4 (`14ad487`): 22 썸네일 (admin sections, competition list/detail/page, home carousel, navbar, home-after-hero, profile grids, search-nav, shorts, series-episodes, up-next, share-modal)
- P2-5 (`59f7bad`): 히어로 배너 3개 + `priority` (LCP 핵심) — competition-hero, competition-detail, profile-settings banner
- 핫픽스 (`7a7f213`): `image.mux.com` 호스트 추가 (Mux animated GIF)

**보존:** 폼 preview 12 사이트 — `blob:`/`data:` URI 사용으로 `next/image` 부적합. P2-6에서 `eslint-disable` 주석 추가 예정 (이 commit).

### M1 + M2 — Metadata + Dynamic OG
- M1-1 (`086c17b`): 정적 페이지 11개 metadata. public 3개 (competition, landing, business), private 6개 (`robots: noindex`), 2개 layout (auth, admin).
- M1-2 + M2 (`513de3e`): 5 dynamic route generateMetadata + per-row OG images (watch, competition, profile, creator, tools).

### 기타
- `193e653`: `sitemap.ts` + `robots.ts` 추가
- `797121e`: default-avatar/banner PNG 압축 (-6.8MB)

### Phase A — 페이지 server component 전환 (Batch 0 + 1)
- A.1 (audit only): `*-client.tsx` 16 파일 분류 — C/W/S/U, ROI 매트릭스
- Batch 0 (`b88a3d2`, -2,155줄): 5 orphan 파일 + dead export 제거
  - `films-page-client.tsx`, `creator-page-client.tsx`, `competition-page-client.tsx`, `feed-page-client.tsx`, `public-profile-client.tsx`
  - `watch-detail-client.tsx::WatchVideoMetaRow` 함수 + 7개 dead import 정리
- Batch 1 (`c3c471b`, -4줄): `"use client"` 제거 → server component 전환
  - `tools/tool-detail-client.tsx` (349줄), `business/business-landing-client.tsx` (299줄) — hook 0 / event 0 / 브라우저 API 0 확인됨
- Batch 2/3 (보류): `useI18n` 서버 정책 결정 필요. `home-page-client` / `profile-page-client` 같은 대형 파일은 design carve-up 동반.

---

## 부록: CLAUDE.md와의 차이 요약

| 항목 | CLAUDE.md | 실제 코드 | 상태 |
|---|---|---|---|
| Next.js 버전 | **16.2.3** | **16.2.3** | ✅ 동기화 |
| 브랜드 primary | `#534AB7` (semantic 토큰) | `globals.css` `:root` 토큰 통일 (`72d9df4`) | ✅ 동기화 |
| Vimeo | "legacy fallback만 유지" | `vimeo.ts` 제거. `Video.vimeoId` field + `watch-video-embed.tsx` 분기는 보존 | ✅ 동기화 |
| 페이지 데이터 fetch | "서버 컴포넌트에서" | 다수 페이지가 `*-client.tsx`로 클라이언트 처리 (Hydration 비용 큼) | 🟡 부분 |
| 베타 2 Films 구조 | 명시 | 미구현 — Phase C 대기 |
| 다국어 | "영어 기본 + ko/ja overrides" | 일치 (ko/ja 일부만 채워짐) | ✅ 정책 동기화 (번역 완성도는 별개 작업) |
