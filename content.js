// Posters supplied by 星曜AG. Direct video URLs can be attached through previewVideo.
// Display curated to 8 evenly spaced clips; files clip-1..18 remain on disk.
window.PORTFOLIO_DATA = {
  videoClips: [1, 3, 5, 7, 9, 11, 13, 15].map((number) => {
    const posters = [
      './assets/happytown.jpg',
      './assets/wild-grass-home.png',
      './assets/ask-guan-gong.png',
      './assets/cadillac-tvc.png',
      './assets/last-audience.png'
    ];
    const index = [1, 3, 5, 7, 9, 11, 13, 15].indexOf(number);
    return {
      title: '影像片段 ' + String(index + 1).padStart(2, '0'),
      category: '视频片段',
      cover: posters[index % posters.length],
      previewVideo: './assets/videos/clip-' + number + '.mp4',
      url: 'https://www.liblib.art/userpage/9d8925c591a643bbad8ca8cfbb87922c/publish/libtv',
      description: '星曜AG影像作品片段 ' + String(index + 1).padStart(2, '0') + '。',
      coverType: '视频片段'
    };
  }),
  works: [
    {
      title: '欢愉镇',
      category: 'AI短片',
      cover: './assets/happytown.jpg',
      url: 'https://www.liblib.art/userpage/9d8925c591a643bbad8ca8cfbb87922c/publish/libtv',
      description: '星曜AG AI短片作品《欢愉镇》。',
      coverType: '作品海报'
    },
    {
      title: '荒草有家',
      category: 'AI短片',
      cover: './assets/wild-grass-home.png',
      url: 'https://www.liblib.art/userpage/9d8925c591a643bbad8ca8cfbb87922c/publish/libtv',
      description: '星曜AG AI短片作品《荒草有家》。',
      coverType: '作品海报'
    },
    {
      title: '问关公',
      category: 'AI短片',
      cover: './assets/ask-guan-gong.png',
      url: 'https://www.liblib.art/userpage/9d8925c591a643bbad8ca8cfbb87922c/publish/libtv',
      description: '星曜AG AI短片作品《问关公》。',
      coverType: '作品海报'
    },
    {
      title: '凯迪拉克TVC',
      category: 'TVC营销广告',
      cover: './assets/cadillac-tvc.png',
      url: 'https://www.liblib.art/userpage/9d8925c591a643bbad8ca8cfbb87922c/publish/libtv',
      description: '凯迪拉克·凯威德全尺寸纯电公路旗舰影像广告。',
      coverType: '作品海报'
    },
    {
      title: '最后一个观众',
      category: 'AI短片',
      cover: './assets/last-audience.png',
      url: 'https://www.liblib.art/userpage/9d8925c591a643bbad8ca8cfbb87922c/publish/libtv',
      description: '星曜AG AI短片作品《最后一个观众》。',
      coverType: '作品海报'
    }
  ]
};
