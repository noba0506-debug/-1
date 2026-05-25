import { Photo } from './types';
import introHero from './main.jpg';
import springMaster from './main.jpg';
import summerMaster from './main3 (2).jpg';
import autumnMaster from './main3 (1).jpg';
import winterMaster from './main4.jpg';

// Let's import or define the exact generated image assets with compiled Vite URLs
export const GENERATED_IMAGES = {
  introHero,
  springMaster,
  summerMaster,
  autumnMaster,
  winterMaster
};

export const photosData: Photo[] = [
  // --- SPRING (봄) ---
  {
    id: 'spring-master',
    src: GENERATED_IMAGES.springMaster,
    title: '사계화(四季花): 첫 피어남',
    tags: ['대표작', '벚꽃', '봄의 서막', '여인의 향기'],
    aspectRatio: '3/4',
    description: '따스한 봄 햇살 아래 아지랑이 차오르듯 부드럽게 번지는 설렘. 사계의 문을 여는 첫 번째 만개입니다.',
    season: 'spring',
    featured: true
  },

  // --- SUMMER (여름) ---
  {
    id: 'summer-master',
    src: GENERATED_IMAGES.summerMaster,
    title: '사계화(四季花): 초록의 눈부심',
    tags: ['대표작', '청량', '초록 그림자', '눈빛'],
    aspectRatio: '3/4',
    description: '싱그러운 여름 그늘 아래 빛나는 눈동자. 나뭇잎 사이로 부서져 내린 영롱한 그림자가 얼굴 위에서 리듬을 탑니다.',
    season: 'summer',
    featured: true
  },

  // --- AUTUMN (가을) ---
  {
    id: 'autumn-master',
    src: GENERATED_IMAGES.autumnMaster,
    title: '사계화(四季花): 깊어지는 갈망',
    tags: ['대표작', '가을감성', '차분함', '니트웨어'],
    aspectRatio: '3/4',
    description: '낙엽의 건조한 질감과 차분해진 톤이 주는 서정적인 성숙미. 가을이 무르익은 캔버스 속에서 자아내는 깊은 시선입니다.',
    season: 'autumn',
    featured: true
  },

  // --- WINTER (겨울) ---
  {
    id: 'winter-master',
    src: GENERATED_IMAGES.winterMaster,
    title: '사계화(四季花): 은빛 정적',
    tags: ['대표작', '눈꽃', '포근함', '눈밭'],
    aspectRatio: '3/4',
    description: '차가운 공기를 감싸 안는 따뜻한 화이트 캐시미어. 어깨 위로 조심스레 내려앉은 첫눈과 같은 안온함입니다.',
    season: 'winter',
    featured: true
  }
];

export const artistEssay = {
  author: '김태곤 (Tae-gon Kim)',
  profileImg: GENERATED_IMAGES.introHero,
  quote: '"오직 내 렌즈를 투과해 나의 계절을 가득 채웠던, 세상에서 단 한 명뿐인 나의 우주이자 봄•여름•가을•겨울의 꽃인 당신에게."',
  prologue: [
    '차가운 카메라 렌즈 너머로 내가 평생을 두고 찾아 헤맸던 조우가 있었다면, 그것은 단언컨대 당신이라는 빛이 머물던 그 자리였습니다. 흐드러지게 피어 오르던 화사한 봄날의 벚꽃 군락도, 가슴이 시리도록 무성했던 청량한 여름의 나무 그늘도, 내 온 신경을 온전히 뒤흔들며 붙잡았던 당신의 맑고 어여쁜 눈동자 앞에서는 그저 차갑고 정적인 배경에 지나지 않았습니다.',
    '나의 피사체가 되어 흔연히 마주쳐 준 당신의 섬세한 몸짓과 숨결은 단순히 기계식 셔터 소리에 맞춰 흐르고 마는 정동(Affect)이 아니었습니다. 눈부신 속도로 흐르고 흩어져 버리는 33년이라는 시간의 파도 속에서, 내가 유일하게 붙잡아 영원으로 남겨두고 싶었던 당신이라는 한 여인에 대한 지극한 헌사이자 진심 어린 동경이었습니다.'
  ],
  epilogue: [
    '쓸쓸하게 불어오는 주황빛 가을바람에 어깨를 웅크린 채 아련히 뒤를 돌아보던 쓸쓸하고 우아한 옆모습과, 세상을 새하얗게 덮어 내리던 시린 겨울날에 온기를 찾아 도톰한 하얀 캐시미어 속으로 아늑하게 볼을 묻으며 소박하고 무구하게 웃던 당신의 미소까지. 그 고운 찰나들을 모아 사계화라는 영원의 액자 속에 정성스레 걸어둡니다.',
    '세상이 아무리 바쁘고 소란하게 우리를 스쳐 갈지라도, 내가 깊이 탐해왔던 당신의 모든 사계절은 내 필름보다 더 지워지지 않는 영혼의 한편에 가장 맑고 눈부신 채도로 영원히 머무를 것입니다. 불어오는 따스한 훈풍도, 대지에 내리는 찬란한 안개도 모두 당신만을 축복하며 다정하게 흐르기를 소망합니다. 고맙습니다. 나의 계절, 오직 나의 빛나는 한 여자인 당신에게.'
  ]
};
