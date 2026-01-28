const { Command } = require('commander');
const fs = require('fs');
const Crawler = require('./crawler');

const program = new Command();

program.version('1.0.5');
program.option('-u, --username <username>', 'velog 유저이름');
program.option('-d, --delay <ms>', '요청 딜레이 시간');
program.option('-c, --cert <access_token>', 'velog 유저 access_token');
program.option('-w, --with-detail', '시리즈, 썸네일 등 디테일한 정보 포함')

program.parse(process.argv);

!fs.existsSync('./backup') && fs.mkdirSync('./backup');
!fs.existsSync('./backup/content') && fs.mkdirSync('./backup/content');
!fs.existsSync('./backup/images') && fs.mkdirSync('./backup/images');

const crawler = new Crawler(program.username, { 
  delay: program.delay || 0,
  cert: program.cert,
  withDetail: program.withDetail || false,
});

async function main() {
  console.log('📙 백업을 시작합니다 / velog-backup');
  await crawler.parse();
}

main().catch((e) => {
  console.error(`⚠️ 백업 실행 중 오류가 발생했습니다. / error = ${e}`);
  process.exit(1);
});
