# Lottery Operator Handbook

월간 응모권 추첨 시스템 운영 가이드. 운영진(admin)이 매 월 사이클 진행 시 참고.

---

## 시스템 개요

### 핵심 흐름

```
업로드 + 본인 제작 체크 + 30s 이상
  → entry_tickets row 발급
  → 진행 중 모든 콘테스트에 competition_entries 자동 INSERT
운영진이 콘테스트별로 추첨 트리거
  → draw_competition_winners() RPC
  → 5명 winner INSERT + 자동 알림 + 이메일
  → 당첨자가 /winners/claim/[token] 접속 → 이메일 인증 → 정보 제출
운영진이 정보 검수
  → "Mark verified" (claim_status confirmed)
  → 송금 처리 (외부 PayPal/Wise)
  → "Mark paid" (claim_status paid)
```

### 응모권 자격
- `videos.original_attestation_at` IS NOT NULL (체크박스 동의)
- `videos.duration_seconds >= 30`
- 사용자의 이번 달 (KST) `entry_tickets` count < 5

### 1인 1상 보장
- DB 레벨 partial UNIQUE on `(competition_id, user_id) WHERE claim_status != 'invalidated'`
- 추첨 알고리즘: `row_number() OVER (PARTITION BY user_id ORDER BY md5(entry_id||seed))`

---

## 월간 사이클 (운영진 액션)

### 1. 콘테스트 준비
새 콘테스트 생성:
- `/admin?tab=competition` → "Create competition" 폼
- `status='Open'`, `start_date` / `deadline` 설정
- 사용자 업로드 시 자동 응모됨

### 2. 응모 모니터링
- `/admin?tab=lottery` → **Competitions section**
- 응모 수 + 응모자 수 실시간 확인
- 콘테스트 페이지 (`/competition/[id]`)에도 "Entries" stat 노출

### 3. 추첨 (콘테스트 종료 후)
- `/admin?tab=lottery` → **Competitions section** → 해당 콘테스트 row
- **`Draw` 버튼** 클릭 → confirm 다이얼로그
- 결과: 5명 winners INSERT + 알림/이메일 자동 발송
- `notified_at` 컬럼이 dispatch 후 stamp됨 (재실행 시 no-op)

### 4. 결과 검토 + 당첨자 정보 제출 대기
- **Winners section** → 5명 row 표시
- 각 row의 `claim_status` 추적:
  - `pending` → 당첨자 token URL 미접속 / 정보 미제출
  - `submitted` → 정보 제출 완료, 운영진 검수 대기
  - `confirmed` → 운영진 검수 완료, 송금 대기
  - `paid` → 송금 완료
  - `expired` → 1달 마감 도과 (cron 자동 처리)
  - `invalidated` → 재추첨됨 (이 행은 무효)

### 5. 자동 알림 흐름
운영진이 손댈 필요 없음:
- **D-3 / D-1**: 매일 15:10 UTC cron이 `lottery_reminder` 알림 + 이메일 발송
- **1달 도과**: 매일 15:05 UTC cron이 `claim_status='expired'` 으로 자동 flip

### 6. 정보 검수 (`submitted` → `confirmed`)
- Winners section → 카드의 "Show info" 클릭
- 핵심 비교:
  - `Legal name` vs `Payment email` 일치 여부
  - `Country` vs `Payment currency` (Wise만)
  - 명백한 가짜 / 도용 의심 시: "Redraw tier" + 사유 기록
- 정상이면: **"Mark verified"** → `claim_status='confirmed'`

### 7. 송금 (`confirmed` → `paid`)
- 외부 결제 시스템 (PayPal / Wise)에서 송금 실행
- Transaction ID / Reference 복사
- Admin panel: **"Mark paid"** → prompt에 reference 붙여넣기
- DB: `winner_info.paid_at` + `payment_reference` 채워짐, `claim_status='paid'`

### 8. 신고 처리 (필요 시)
- `/admin?tab=content` → 신고 목록
- 검토 후 위반 확인 시 신고를 `reviewing` 또는 `resolved` 로 transition
- **ShieldOff 아이콘 버튼** 클릭 → 해당 영상의 응모권 회수
  - `entry_tickets.status='revoked'` + `revoked_reason='report_violation'`
  - `competition_entries.eligible=false` (그 ticket의 모든 entries)
  - 사용자의 월간 카운트는 차감 유지 (페널티 정책)

### 9. 재추첨 (사후 문제 발견 시)
필요 케이스:
- 당첨자의 신원이 사용자 데이터와 불일치
- 표절/위반 사실이 사후 드러남
- 사용자가 자진 사퇴

운영 절차:
- Winners section → 해당 카드 footer **"Redraw tier"** 버튼
- prompt: 사유 입력 (필수)
- 결과:
  - 기존 winner row → `claim_status='invalidated'`
  - 신규 winner row 같은 tier에 INSERT (자동 알림 + 이메일 발송)
  - 무효화된 user_id는 그 콘테스트에서 영구 제외 (이 정책 spec에 명시)
- **단, `confirmed` / `paid` 상태는 redraw 거부** (송금 후 회수 불가, 운영진 수동 follow-up)

---

## 추첨 알고리즘 안정성

### 결정론적 추첨
```
seed = encode(gen_random_bytes(16), 'hex')  -- 128-bit hex
draw_key(entry) = md5(entry_id || seed)
사용자별 순위 = row_number() OVER (PARTITION BY user_id ORDER BY draw_key)
상위 5 (user_rank=1, draw_key 오름차순)
```

- 같은 (pool, seed) → 같은 winners
- `drawing_logs.seed_value` 보존 → 재현 가능
- `winners_snapshot` (jsonb) → 결과 히스토리

### 동시성 보호
- `pg_advisory_xact_lock(hashtext('lottery_draw:' || competition_id))` — 같은 콘테스트 추첨/재추첨 직렬화
- partial UNIQUE on `(competition_id, prize_tier)` — race condition 시 한 쪽만 성공

---

## DB 직접 접근이 필요한 경우

### 운영진 권한 부여 (ADMIN_EMAILS)
`src/lib/auth/admin.ts` 의 `isAdminEmail()` 화이트리스트에 추가 필요.

### Drawing log 조회 (감사)
- Admin: `/admin?tab=lottery` → **Audit log section** (최근 50개)
- 직접 쿼리:
  ```sql
  select * from drawing_logs
  where competition_id = 'X'
  order by drawn_at desc;
  ```

### 무효화된 winner row 확인
```sql
select * from competition_winners
where competition_id = 'X' and claim_status = 'invalidated';
```

### 회수된 응모권 (페널티 추적)
```sql
select t.user_id, t.video_id, t.revoked_reason, t.revoked_at
from entry_tickets t
where t.status = 'revoked'
order by t.revoked_at desc;
```

### 진행 중인 이메일 인증 (디버깅용)
```sql
select * from winner_email_verifications
where consumed_at is null
order by created_at desc;
```

---

## 환경 변수

| 변수 | 용도 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 롤 (admin RPC 호출) | ✅ |
| `RESEND_API_KEY` | 당첨 알림 + 인증 코드 + 리마인더 이메일 | ⚠️ 없으면 dev fallback (이메일 발송 skip, 코드는 DB에 남음) |
| `NOTIFY_FROM_EMAIL` | 발송자 이메일 | 선택 (default `onboarding@resend.dev`) |
| `CRON_SECRET` | Vercel cron 인증 | ✅ |
| `NEXT_PUBLIC_SITE_URL` | claim URL 생성용 | ✅ (default `https://genova-silk.vercel.app`) |

---

## 트러블슈팅

### "추첨 버튼이 disabled됨"
- 응모자 수 0 (`entry_count === 0`). 응모 발생 후 다시 시도.

### "no_eligible_entries" 에러
- 추첨 직전 재검증에서 모든 entries가 `eligible=false`로 flip됨
- 가능한 원인: 모든 영상이 private/삭제/계정 해지
- DB 직접 확인: `select count(*) from competition_entries where competition_id='X' and eligible=true;`

### "already_drawn" 에러
- 콘테스트에 이미 live winner 행 존재. 재추첨 원할 시 redraw 사용.

### "cannot_redraw_after_payment" 에러
- `confirmed` 또는 `paid` 상태는 redraw 거부 (spec 정책)
- 송금 회수가 가능하면 수동 처리 후 `claim_status` 를 직접 `invalidated` 로 UPDATE, 그 후 redraw 가능
- 안전한 SQL:
  ```sql
  update competition_winners
  set claim_status = 'invalidated'
  where id = '...' and claim_status in ('confirmed','paid');
  -- 그 후 admin panel에서 Redraw tier 클릭
  ```

### 이메일이 발송 안 됨
1. `RESEND_API_KEY` 환경 변수 확인
2. Resend 대시보드에서 send log 확인
3. 그래도 안 가면 `winner_email_verifications` 테이블의 `code` 컬럼을 운영진이 수동으로 사용자에게 전달

### Cron이 실행 안 됨
- Vercel dashboard → Crons 탭 → 실행 로그 확인
- Bearer 인증 실패 시 `CRON_SECRET` 미일치
- vercel.json에 schedule이 명시되어 있는지 확인

---

## 관련 코드 위치

| 영역 | 경로 |
|---|---|
| 발급 RPC | `supabase/migrations/20260516160100_*.sql#issue_lottery_ticket` |
| 추첨 RPC | 같은 파일 `#draw_competition_winners` |
| 재추첨 RPC | 같은 파일 `#redraw_winner_slot` |
| 만료 RPC | 같은 파일 `#expire_unclaimed_winners` |
| Claim 함수 3개 | `20260516170000_winner_claim_flow.sql` |
| Admin actions | `src/app/actions/lottery-admin.ts` |
| Admin UI | `src/components/admin/sections/lottery-management.tsx` |
| Claim 페이지 | `src/app/winners/claim/[token]/page.tsx` |
| 이메일 helper | `src/lib/email.ts` |
| 만료 cron | `src/app/api/cron/lottery-expire/route.ts` |
| 리마인더 cron | `src/app/api/cron/lottery-reminders/route.ts` |
