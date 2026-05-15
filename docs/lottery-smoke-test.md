# Lottery Smoke Test Scenarios

응모권 추첨 시스템 라이브 배포 후 검증 시나리오. 각 시나리오는 **선행 조건** → **재현 단계** → **기대 결과 (UI + DB)**.

수동 검증용 체크리스트. 향후 Playwright 자동화로 확장 가능.

---

## 환경 준비

### 필수
- ✅ 모든 13 마이그레이션 + 1 A1 마이그레이션 적용됨 (총 14)
- ✅ `RESEND_API_KEY` 설정됨 (이메일 발송 시나리오)
- ✅ 테스트용 관리자 계정 (ADMIN_EMAILS 등록)
- ✅ 테스트용 일반 사용자 계정 2개 이상

### 옵션 (안전 검증용)
- staging 환경 권장. production이면 후속 정리 SQL 준비.

---

## 1. 정상 응모권 발급

**전제**: 사용자 A의 이번 달 응모권 카운트 < 5

**단계**:
1. 사용자 A로 로그인
2. `/upload` 진입 → 카운터 카드 N/5 확인
3. 30초 이상 비디오 선택 + 제목 입력
4. **"본인이 직접 제작한 영상" 체크**
5. Submit
6. Mux polling 완료 대기 (최대 3분)

**기대 결과**:
- UI: toast `"<title>" entered the lottery (N+1/5 this month)`
- UI: `/upload` 재방문 시 카운터 N+1/5
- DB:
  ```sql
  select * from entry_tickets where user_id = '<A>' order by issued_at desc limit 1;
  -- status='active', video_id matches, month_key='2026-MM'
  
  select * from competition_entries where ticket_id = '<above>';
  -- one row per active competition, eligible=true
  ```

---

## 2. 30초 미만 영상 (응모권 미발급)

**전제**: 사용자 B, 짧은 영상 준비

**단계**: 동일 — 본인 제작 체크 + 30초 미만 영상

**기대 결과**:
- UI: toast `"No ticket issued · Clip must be at least 30 seconds"`
- UI: 카운터 변동 없음
- DB: `entry_tickets` 신규 row 없음

---

## 3. 본인 제작 미체크 (응모권 미발급, silent)

**전제**: 사용자 A 등

**단계**: 영상 업로드 시 **체크박스 미선택**

**기대 결과**:
- UI: 업로드 완료 toast만 표시, lottery toast 없음 (silent)
- DB:
  ```sql
  select original_attestation_at from videos where id = '<new>';
  -- NULL
  select count(*) from entry_tickets where video_id = '<new>';
  -- 0
  ```

---

## 4. 월 5장 초과 (limit 차단)

**전제**: 사용자 A의 이번 달 카운트가 이미 5

**단계**: 6번째 영상 (조건 충족) 업로드 시도

**기대 결과**:
- UI: toast `"No ticket issued · You've already used all 5 tickets this month"`
- 영상 row는 정상 INSERT됨 (lottery 실패해도 video 작성 자체는 성공)
- DB: `entry_tickets` 카운트 5 유지

---

## 5. 영상 삭제 시 응모권 자동 회수

**전제**: 사용자 A에게 active 응모권 1장 존재

**단계**:
1. `/profile/[A]` → 영상 카드 hover → 편집 → 삭제 (또는 admin이 video DELETE)
2. DB transition 확인:

**기대 결과**:
- DB:
  ```sql
  select status, revoked_reason, revoked_at, video_id
  from entry_tickets where id = '<ticket>';
  -- status='revoked', revoked_reason='video_deleted',
  -- revoked_at non-null, video_id=NULL
  
  select eligible from competition_entries where ticket_id = '<ticket>';
  -- 행 자체는 살아있음 (CASCADE 안 됨), eligible 그대로
  -- (이건 draw 직전 재검증에서 false 처리됨)
  ```
- 카운터: revoked 행도 카운트에 포함됨 (페널티)

---

## 6. 추첨 트리거 + 알림 발송

**전제**: 콘테스트 X에 응모자 5명 이상, 운영진 권한

**단계**:
1. 운영진 로그인 → `/admin?tab=lottery`
2. Competitions section 에서 X 행의 **"Draw" 클릭** → confirm
3. 잠시 대기 후 페이지 새로고침

**기대 결과**:
- UI: toast `Drew 5 winners for "X"` + Competitions 표가 "Results →"로 전환
- DB:
  ```sql
  select count(*) from competition_winners where competition_id = '<X>';
  -- 5
  select claim_status from competition_winners where competition_id = '<X>';
  -- 5 rows of 'pending'
  
  select * from drawing_logs where competition_id = '<X>' and is_redraw = false;
  -- 1 row, seed_value non-empty, winners_snapshot JSON length 5
  ```
- 알림:
  ```sql
  select user_id, type, title, href from notifications
  where entity_type = 'competition_winner' and type = 'lottery_winner'
  order by created_at desc limit 5;
  -- 5 rows, href = '/winners/claim/<token>'
  
  select notified_at from competition_winners where competition_id = '<X>';
  -- 5 rows, all non-null (dispatched)
  ```
- 이메일 (RESEND_API_KEY 설정 시): Resend dashboard 또는 받은편지함에서 발송 확인

---

## 7. Claim flow (3-step end-to-end)

**전제**: 시나리오 6 통과, 당첨자 1명 선택

**단계**:
1. 당첨자의 알림 또는 이메일에서 URL 열기 → `/winners/claim/<token>`
2. UI 헤더: Tier N · $100 USD · `Submit by <date>` · `30 day(s) left`
3. **Step 1**: "Send verification code" 클릭
4. 잠시 후 이메일에 6자리 코드 도착
5. **Step 2**: 코드 입력 → "Verify"
6. **Step 3**: 폼 채움 (legal_name, country, contact_extra, payment_method, payment_email, currency if wise, consent ✓) → Submit

**기대 결과**:
- UI: 각 step 진행 시 카드 색 active → done 전환. 최종 success 메시지.
- DB:
  ```sql
  select id, claim_status from competition_winners where claim_token = '<token>';
  -- claim_status='submitted'
  
  select * from winner_info where winner_id = '<id>';
  -- 1 row, email_verified=true, payment fields set, submitted_ip non-null
  
  select code, consumed_at from winner_email_verifications
  where winner_id = '<id>' order by created_at desc;
  -- latest row consumed_at non-null
  ```
- Admin: `/admin?tab=lottery` → Winners section → 카드 footer "Mark verified" 버튼 노출

---

## 8. 이메일 코드 5회 실패 → 락아웃

**전제**: 시나리오 7의 Step 1 통과한 상태, Step 2 진입

**단계**: 잘못된 6자리 코드 입력 5회 반복

**기대 결과**:
- 1~4번째 시도: UI `"Wrong code. Try again or request a new one."`
- 5번째 시도: 동일 메시지, 단 그 후 정확한 코드를 입력해도 fail
- DB:
  ```sql
  select failed_attempts, consumed_at from winner_email_verifications
  where winner_id = '<id>' order by created_at desc limit 1;
  -- failed_attempts=5, consumed_at non-null (locked)
  ```
- 복구: "Send a new code" 클릭 → 새 verification row INSERT, 이전 row는 invalid

---

## 9. 추첨 후 재추첨 (운영진 트리거)

**전제**: 시나리오 6 통과, tier 3 당첨자가 claim_status='pending' 상태

**단계**:
1. `/admin?tab=lottery` → Winners section → tier 3 카드 footer "Redraw tier" 클릭
2. Prompt에 사유 입력 ("표절 의심" 등) → confirm

**기대 결과**:
- DB:
  ```sql
  select claim_status from competition_winners
  where competition_id = '<X>' and prize_tier = 3
  order by drawn_at;
  -- 첫 row: 'invalidated'
  -- 둘째 row: 'pending' (새 winner, 이전 user_id와 다름)
  
  select * from drawing_logs
  where competition_id = '<X>' and is_redraw = true
  order by drawn_at desc limit 1;
  -- redraw_prize_tier=3, redraw_reason='표절 의심', redraw_of=<initial log id>
  ```
- 새 winner에게 자동 알림 + 이메일 발송됨 (dispatchWinnerNotifications)
- 이전 winner의 ticket: status='active'로 복원

### 9-1. confirmed/paid 상태 redraw 거부
- 시나리오 7 통과한 winner (claim_status='confirmed' 후) 에 대해 "Redraw tier" 시도
- 기대: 에러 메시지 `cannot_redraw_after_payment: status=confirmed`
- 회복 (운영진 수동): DB에서 직접 `claim_status='invalidated'` 로 UPDATE, 그 후 다시 redraw 가능

---

## 10. D-3 / D-1 리마인더 cron

**전제**: 시나리오 6 통과, info_deadline이 ~3일 후 또는 ~1일 후

**옵션 A** (실제 시간 대기, 비현실적): cron 자동 실행 대기

**옵션 B** (강제 트리거):
```sql
-- info_deadline을 인위적으로 D-3 윈도우로 이동
update competition_winners
set info_deadline = now() + interval '3 days'
where claim_token = '<token>';
```

수동 cron 호출:
```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://<your-domain>/api/cron/lottery-reminders
```

**기대 결과**:
- HTTP 200 + JSON `{ "d3": 1, "d1": 0, "errors": 0 }`
- DB:
  ```sql
  select reminder_d3_at from competition_winners where claim_token = '<token>';
  -- non-null
  
  select count(*) from notifications
  where entity_id = '<winner_id>' and type = 'lottery_reminder';
  -- 1
  ```
- 재호출 → `{ "d3": 0, "d1": 0 }` (idempotent)

---

## 11. 만료 자동 처리 cron

**전제**: claim_status='pending' winner의 info_deadline이 과거

**강제 setup**:
```sql
update competition_winners
set info_deadline = now() - interval '1 day'
where claim_token = '<token>' and claim_status = 'pending';
```

**단계**:
```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://<your-domain>/api/cron/lottery-expire
```

**기대 결과**:
- HTTP 200 + JSON `{ "expired": 1 }`
- DB:
  ```sql
  select claim_status from competition_winners where claim_token = '<token>';
  -- 'expired'
  ```
- 재호출 → `{ "expired": 0 }`

---

## 12. 신고 → 응모권 회수

**전제**: 사용자 A에게 active 응모권 1장 존재, 다른 사용자가 그 영상을 신고함

**단계**:
1. 운영진 로그인 → `/admin?tab=content`
2. 신고 list에서 해당 row → 상태를 `reviewing` 으로 transition
3. **ShieldOff 아이콘 버튼 클릭** → confirm 다이얼로그

**기대 결과**:
- UI: toast `Ticket revoked for "<title>"`
- DB:
  ```sql
  select status, revoked_reason from entry_tickets
  where video_id = '<videoId>';
  -- status='revoked', revoked_reason='report_violation'
  
  select eligible from competition_entries
  where ticket_id = '<ticket_id>';
  -- all rows: eligible=false
  ```
- 사용자의 카운트는 차감 유지 (페널티)

---

## 13. 동시성 — 동일 사용자 두 영상 동시 발급

**전제**: 사용자 A의 카운트 = 4. 두 영상을 거의 동시에 업로드.

**옵션 A** (실제 두 탭): 두 탭에서 동시에 Submit

**옵션 B** (SQL stress test): 같은 user_id로 issue_lottery_ticket RPC를 동시에 호출
```sql
-- 두 세션에서 동시 실행
select * from issue_lottery_ticket('<userA>', '<video1>');
-- 다른 세션:
select * from issue_lottery_ticket('<userA>', '<video2>');
```

**기대 결과**:
- 두 호출 모두 성공해도 OK (5장째까지는 발급 가능)
- 정확히 5장 도달 후 6번째는 `monthly_limit_reached` 에러
- DB 카운트가 절대 6 이상이 되면 안 됨 (advisory lock 검증)

---

## 14. 동시성 — 동일 콘테스트 두 운영진 동시 추첨

**전제**: 콘테스트 X에 응모자 5명 이상. 두 운영진이 거의 동시에 Draw 클릭.

**기대 결과**:
- 한 쪽: 성공 (5명 winner 생성 + 알림 발송)
- 다른 쪽: 에러 (advisory lock 직렬화 → 두 번째는 `already_drawn`)
- DB:
  ```sql
  select count(*) from competition_winners
  where competition_id = '<X>' and claim_status != 'invalidated';
  -- exactly 5
  ```

---

## 후속 정리 SQL (production 검증 후)

테스트 데이터 정리:

```sql
-- 특정 콘테스트의 모든 winners/info 삭제 (FK CASCADE)
delete from competition_winners where competition_id = '<test-X>';

-- 특정 사용자의 모든 응모권 삭제
delete from entry_tickets where user_id = '<test-user>';

-- 특정 콘테스트의 모든 entries 정리
delete from competition_entries where competition_id = '<test-X>';

-- drawing_logs 정리 (audit는 보존 권장. 정말 지울 때만)
delete from drawing_logs where competition_id = '<test-X>';

-- 미사용 verification 코드 정리
delete from winner_email_verifications where expires_at < now() - interval '1 day';
```

---

## 시나리오 체크리스트 요약

| # | 시나리오 | 통과 |
|---|---|---|
| 1 | 정상 응모권 발급 | ☐ |
| 2 | 30초 미만 차단 | ☐ |
| 3 | 본인 제작 미체크 silent | ☐ |
| 4 | 월 5장 초과 차단 | ☐ |
| 5 | 영상 삭제 자동 회수 | ☐ |
| 6 | 추첨 + 알림/이메일 발송 | ☐ |
| 7 | Claim flow end-to-end | ☐ |
| 8 | 코드 5회 실패 락아웃 | ☐ |
| 9 | 재추첨 | ☐ |
| 9-1 | confirmed/paid redraw 거부 | ☐ |
| 10 | D-3/D-1 리마인더 cron | ☐ |
| 11 | 만료 자동 cron | ☐ |
| 12 | 신고 → 회수 | ☐ |
| 13 | 동시 발급 동시성 | ☐ |
| 14 | 동시 추첨 동시성 | ☐ |
