# Wiggles' Front Yard · 꿈틀이의 앞마당

지렁이 꿈틀이가 메마른 땅을 살리는 웹 게임. 설치 없이 브라우저에서 실행됩니다.
- 게임 주소 `/` = English, `/ko` = 한국어

## 폴더 안내
| 위치 | 내용 |
|---|---|
| `src/index.html` | 화면 모양(HTML/CSS). **더블클릭하면 바로 실행**돼서 고친 걸 확인하기 좋아요 |
| `src/js/00-core.js` | 기본 설정, 소리, 배경음악 |
| `src/js/10-land.js` | 땅, 과일나무, 꿈틀이, 조작, 영양분 |
| `src/js/20-enemies.js` | 두더지, 앵무새 버터, 비 |
| `src/js/30-game.js` | 퀘스트, 상장, 목숨, 화면 글씨, 게임 진행 |
| `src/js/40-draw.js` | 마당 그리기 |
| `src/js/50-world.js` | 지구본 + 버터 타고 비행 |
| `src/js/60-burrow.js` | 두더지 굴 (지하 러너) |
| `src/js/90-main.js` | 매 순간 돌아가는 메인 루프 |
| `src/i18n-en.json` | 영어 번역표 (새 문구는 코드에 `L('한국어', 'English')`로 적으면 돼요) |
| `build.mjs` | `src`를 합쳐서 `public/`에 영어판·한국어판을 만드는 프로그램 |
| `GAME_DESIGN.md` | 게임 설계 기록 |

## 함께 만드는 규칙
1. 한 번에 한 가지만 고치고, 무엇을 고쳤는지 한 줄로 적어요 (예: "두더지 속도 조금 느리게").
2. 고친 뒤 `src/index.html`을 열어서 직접 해 보고 올려요.
3. GitHub에 올리면 Vercel이 `node build.mjs`를 실행해서 1~2분 뒤 게임 주소에 반영해요.
