const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'src/template.html');
let content = fs.readFileSync(templatePath, 'utf8');

const regex = /<script type="application\/ld\+json">\s*(\[[\s\S]*?\])\s*<\/script>/;
const match = content.match(regex);

if (match) {
  const jsonStr = match[1];
  const json = JSON.parse(jsonStr);

  // Mark English ones
  json[0].inLanguage = "en";
  json[1].inLanguage = "en";
  json[2].inLanguage = "en";
  
  // Create Korean ones
  const koWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "글로우트리스 (Glowtris)",
    "url": "https://glowtris.com/?lang=ko",
    "inLanguage": "ko",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://glowtris.com/?lang=ko&search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const koVideoGame = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "글로우트리스 (Glowtris)",
    "description": "글로우트리스는 다운로드 없이 웹 브라우저에서 바로 즐길 수 있는 무료 네온 블록 퍼즐 게임입니다. 떨어지는 네온 블록을 쌓아 라인을 클리어하고 글로벌 리더보드에서 경쟁하세요. 데일리 챌린지, 마라톤, 스프린트, 블리츠 모드가 있습니다. 회원가입이나 광고 없이 완전 무료로 플레이하세요.",
    "url": "https://glowtris.com/?lang=ko",
    "inLanguage": "ko",
    "image": "https://glowtris.com/api/og",
    "genre": ["Puzzle", "Arcade", "Block Puzzle", "Tetris-like"],
    "gamePlatform": ["Web Browser", "iOS", "Android"],
    "applicationCategory": "Game",
    "operatingSystem": "Any",
    "keywords": "블록 퍼즐, 테트리스, 무료 웹게임, 데일리 챌린지, 네온 퍼즐, 글로우트리스",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" },
    "author": { "@type": "Person", "name": "sorrysungkwon" },
    "featureList": [
      "데일리 챌린지 — 매일 전 세계 유저와 동일한 블록으로 경쟁",
      "글로벌 실시간 리더보드",
      "마라톤 모드 — 끝없이 이어지는 클래식 블록 쌓기",
      "스프린트 모드 — 40라인을 최대한 빨리 지우기",
      "블리츠 모드 — 2분 안에 최고 점수 달성하기",
      "PWA 지원 — iOS 및 안드로이드 홈 화면에 앱으로 설치 가능",
      "광고나 회원가입 없이 완전 무료"
    ]
  };

  const koFAQPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "inLanguage": "ko",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "글로우트리스(Glowtris)가 무엇인가요?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "글로우트리스는 웹 브라우저에서 다운로드 없이 바로 즐길 수 있는 무료 네온 블록 퍼즐 게임입니다."
        }
      },
      {
        "@type": "Question",
        "name": "어떤 게임 모드가 있나요?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "매일 똑같은 블록이 나오는 데일리 챌린지, 무한으로 즐기는 마라톤 모드, 40라인을 빨리 없애는 스프린트 모드, 2분 안에 높은 점수를 기록하는 블리츠 모드가 있습니다."
        }
      },
      {
        "@type": "Question",
        "name": "정말 무료인가요?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "네, 광고나 회원가입 없이 100% 완전 무료로 즐길 수 있습니다."
        }
      },
      {
        "@type": "Question",
        "name": "모바일에서도 플레이 가능한가요?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "네, 모바일 브라우저에 최적화되어 있으며, PWA(프로그레시브 웹 앱)로 iOS나 안드로이드 홈 화면에 설치하여 앱처럼 즐길 수 있습니다."
        }
      }
    ]
  };

  json.push(koWebSite, koVideoGame, koFAQPage);

  const newJsonStr = JSON.stringify(json, null, 2);
  const newContent = content.replace(regex, `<script type="application/ld+json">\n${newJsonStr}\n</script>`);
  
  fs.writeFileSync(templatePath, newContent);
  console.log("Updated template.html with Korean schemas.");
} else {
  console.log("Could not find JSON-LD in template.html");
}
