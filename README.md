# Dolly Box v0.6 — Supabase Connected

This version connects the UI to Supabase Auth, PostgreSQL, and private Storage.

## Before opening the site

1. In Supabase SQL Editor, run `supabase-setup.sql` once.
2. Confirm Storage bucket `dolly-images` exists and is PRIVATE.
3. Confirm you created your login user in Authentication → Users.

You do NOT need to create folders inside Storage. The app creates paths automatically:
- `<user-id>/dolls/<doll-id>/primary.webp`
- `<user-id>/items/<item-id>/primary.webp`

## Running

For the most reliable test, serve the folder over HTTP instead of double-clicking `index.html`.

From this folder you can run, for example:

`python -m http.server 8000`

Then open:

`http://localhost:8000`

When deployed to GitHub Pages, no local server is needed.

## Included

- Supabase email/password login
- persistent login session
- logout
- real Dolls CRUD
- real Items CRUD
- real Wishlist CRUD
- normalized tags
- private image Storage
- browser-side resize to max 1600px and WebP compression
- signed URLs for private images
- automatic Storage folder paths
- Dashboard counts from real data
- RLS policies for relation tables and Storage

## Security

`supabase.config.js` contains only the Project URL and Publishable Key. Do not add a Secret Key or service_role key to this project.


## v0.6.1 변경

- Item 상세의 Wearing Doll을 클릭 가능한 링크로 변경
- 연결된 인형 이름 클릭 시 해당 Doll 상세 화면으로 이동
- Doll → Item / Item → Doll 양방향 상세 탐색 완성


## v0.6.2 변경

- Item → Doll 이동 시 Doll 상세가 열리지 않던 버그 수정
- Currently Wearing 컨테이너를 고정 id(`dollWearingList`)로 참조하도록 변경
- 반복해서 Doll ↔ Item 왕복해도 정상 작동


## v0.7 변경

- Search 페이지 실제 다중 조건 검색 구현
- Dolls / Items 동시 또는 개별 검색
- 카테고리 / 메이커 / 사이즈 / 태그 / 상태 / 키워드 조합 검색
- Search 필터 옵션은 Supabase 실제 데이터에서 자동 생성
- 검색 결과 카드 클릭 시 해당 Doll / Item 상세로 이동
- Dolls 화면의 카테고리 / Size / Maker / Tag 필터 실제 적용
- Items 화면의 카테고리 / Status / Size / Doll 필터 실제 적용
- Dashboard 검색어를 상세 Search로 넘김


## v0.7.1 변경

- v0.7 Search UI 교체 후 남아 있던 `demoSearchButton` 이벤트 코드를 제거
- 해당 null addEventListener 오류로 앱 부팅/로그인이 중단되던 문제 수정
- 일부 고정 UI 이벤트에 optional chaining 방어 코드 추가


## v1.0 변경

- GitHub Pages 자동 배포 workflow 추가
- `.nojekyll` 추가
- 정적 프로젝트 서브경로 배포 호환
- CSS/JS cache-busting query 추가
- 모바일 safe-area 대응
- 모바일 상세/등록 모달을 bottom-sheet 형태로 보정
- 모바일 메뉴 scrim 및 바깥 탭 닫기
- 터치 타깃 최소 높이 보정
- PWA manifest / 홈 화면용 메타데이터 추가
- `noindex,nofollow,noarchive` 메타 추가
- `DEPLOY.md` 배포/모바일 점검 가이드 추가
