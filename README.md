# velog-backup

![License](https://img.shields.io/packagist/l/cjaewon/velog-backup?style=flat-square)
![Star](https://img.shields.io/github/stars/cjaewon/velog-backup?style=flat-square)
![HitCount](http://hits.dwyl.com/cjaewon/velog-backup.svg)

### 📁 velog (벨로그)의 글을 마크다운 및 이미지로 백업을 해주는 툴 입니다.  
원하는 기능이 있으시면 이슈를 만들어주시면 감사하겠습니다!

- Velog에 올린 글을 백업 해두고 싶을 때
- Github Pages와 Velog를 같이 사용하고 싶을 때

## 기능
### 👇 마크다운 다운로드
Velog에 올린 글을 마크다운 파일로 다운로드 합니다.

### 🏞️ 이미지 다운로드
Velog에 올린 글 중 이미지를 포함하고 있으면 자동으로 이미지를 다운로드 및 마크다운에 링크를 수정합니다.



## 👋 사용법

```bash
> git clone https://github.com/cjaewon/velog-backup
> cd velog-backup

> node app.js --help
Usage: app [options]

Options:
  -V, --version              output the version number
  -u, --username <username>  velog 유저이름
  -d, --delay <ms>           요청 딜레이 시간
  -h, --help                 display help for command

> node app.js -u <유저 이름>

📙 백업을 시작합니다 / velog-backup
✅ <유저 이름>님의 모든 글(2 개) 을 가져옴
✅ " velog-backup vs velog-frontup " 백업 완료
✅ " Nodejs 27.5.0 performance is faster than C " 백업 완료
```

백업 된 파일은 `backup` 폴더 안에 저장되어 있습니다.

![image](https://user-images.githubusercontent.com/32125218/81049982-3af00c80-8efa-11ea-8b2b-8b90827b4d1e.png)


**`content`** : 백업 한 글들이 마크다운 확장자로 저장됩니다.  
**`images`** : 글들이 참조하고 있는 이미지들이 다운로드 되어 저장됩니다.