# 선넘네 UI pixel-first spec

## 1. 기준

- 원본 이미지 크기: 941 × 1672px
- 구현 기준 크기: 390 × 694px
- 비율: 9:16
- 축소 배율: 0.41445
- 구현 목적: 첨부 이미지와 같은 프로토타입 화면을 코드로 최대한 고정 재현

## 2. 전체 스타일

- Background: very pale pink, #FDECF2 계열
- Primary pink: #E61452 계열
- Soft pink: #FBE7EF 계열
- Text black: #171717
- Sub text: #5E6575
- White card: #FFFFFF, 약한 그림자
- 전체 톤: 깨끗한 흰 카드 + 진한 핑크 액센트 + 여백 넓은 모바일 UI

## 3. 주요 레이아웃 좌표, 390 × 694 기준

아래 좌표는 `position:absolute` 기준이다.

| 요소 | left | top | width | height | 비고 |
|---|---:|---:|---:|---:|---|
| screen | 0 | 0 | 390 | 694 | 9:16 고정 |
| status bar | 30 | 15 | 330 | 18 | 프로토타입 캡처용 |
| bell icon | 332 | 52 | 18 | 18 | 우상단 |
| logo area | 58 | 68 | 198 | 58 | 가능하면 SVG asset 사용 |
| subtitle | 64 | 143 | auto | 22 | “무례한 말에 대응할 수 있는 한 문장 검색” |
| search label | 64 | 198 | auto | 22 | 아이콘 + 텍스트 |
| search input card | 51 | 218 | 295 | 53 | radius 14~16 |
| input placeholder | 72 | 232 | auto | 24 | font 19~21 |
| input button | 276 | 228 | 56 | 33 | radius 11~13 |
| chip 1 | 51 | 282 | 143 | 42 | 살쪘네 |
| chip 2 | 201 | 282 | 145 | 42 | 직장/상사 |
| result label | 52 | 343 | auto | 24 | ✦ 검색 결과는... |
| quote card | 51 | 366 | 296 | 99 | radius 14~16 |
| quote badge | 160 | 378 | 69 | 21 | 추천 멘트 |
| quote main text | 104 | 414 | 185 | 24 | center |
| quote sub text | 113 | 442 | 165 | 18 | center |
| principle badge | 169 | 484 | 53 | 20 | 원칙 |
| principle title | 132 | 508 | 126 | 24 | 바로 변명하지 않기 |
| principle sub1 | 142 | 536 | 106 | 18 | 멘트보다 원칙이 중요해요. |
| principle sub2 | 102 | 559 | 187 | 18 | 경계를 먼저 지키고... |
| copy button | 49 | 587 | 292 | 35 | radius 7~9 |
| refresh button | 49 | 630 | 292 | 35 | radius 7~9 |

## 4. 구현 전략

### CSS로 구현할 것

- 배경 그라데이션/톤
- 흰 카드, 그림자, border-radius
- 버튼, 칩, 텍스트 위치
- 큰 구조와 간격

### asset으로 분리할 것

이미지와 완전히 같아야 하는 요소는 CSS로 다시 그리지 말고 에셋으로 빼는 게 좋다.

- 손그림 로고 `logo-seonneomne.svg`
- 배경 오른쪽 말풍선 워터마크 `bg-watermark.svg`
- 상단 벨 아이콘 `bell.svg`
- 검색, 가방, 사람, 복사, 새로고침 아이콘

### 실제 앱으로 옮길 때 주의

이 명세는 9:16 프로토타입 이미지를 맞추기 위한 것이다.
실제 iPhone 390 × 844 화면에 맞추려면, 세로 간격을 늘리고 버튼 높이를 44px 이상으로 키우는 별도 production layout을 만든다.
