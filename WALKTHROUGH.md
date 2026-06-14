# WALKTHROUGH.md (압축본)

## 1. 백엔드 (api/leaderboard.js)
- 일일 챌린지용 Redis 키 분리 (`daily:YYYYMMDD`).
- GET/POST 시 `mode=daily` 분기 처리.

## 2. 프론트엔드 (index.html)
- **시드 RNG:** Mulberry32 도입. 날짜 기반 전 세계 동일 블록 시퀀스.
- **접속 제한:** 로컬 스토리지 검사. 하루 1회 플레이 제한 및 자정 카운트다운.
- **업적 시스템:** 20개 업적. 해금 시 골드 팝업 렌더링. `glowTrisAchievements`에 저장.
- **공유 카드:** 일일 챌린지 전용 캔버스 캡처 추가.

## 3. 버그 픽스 및 최적화
- **iOS PWA 캔버스 크기 오류:** `Option A` (단순 계산식) 적용. ResizeObserver 및 RAF 제거. 콜드 스타트 시 즉시 크기 동기화.
- **메모리 누수:** AudioNode 연결 해제 안 됨, 숨겨진 탭에서 BGM 스케줄러 폭주, WebGL 컨텍스트 누수 모두 해결.
- **성능:** 인텔 iGPU 감지 후 정적 그라디언트 적용. `box-sizing: border-box`로 패널 오버플로우 해결.

## 4. 엔진 재구축 (Phase A: v0.2 ~ v0.4)
- **1000Hz 루프:** 렌더링과 물리 엔진 분리.
- **입력:** 서브프레임(Sub-frame) 큐잉 순서 보장.
- **조작:** 180도 회전, SDF(소프트 드롭 보정), IRS(사전 회전), IHS(사전 홀드), DCD, ARR=0 순간 이동.
- **점수:** B2B(Back-to-Back) 1.5배, 3개 넥스트 큐, All-spin 판정 추가.

## 5. UI 및 소셜 기능 추가
- **디자인:** 챌린지 전용 배경 (어두운 크림슨, 빠른 네뷸라, 대각선 유성우, 앰버 펄스).
- **소셜:** T-Spin Mini 판정, 리더보드 개인 최고 기록 중복 제거, Vercel Edge `/api/og` 동적 이미지 추가. BGM 4트랙(멜로디, 하모니, 베이스, 드럼) 개편.