const { Command } = require('commander');
const fs = require('fs');
const Crawler = require('./crawler');

const program = new Command();

program.version('1.0.0');
program.option('-u, --username <username>', 'velog 유저이름');
program.option('-d, --delay <ms>', '요청 딜레이 시간')

program.parse(process.argv);

!fs.existsSync('./backup') && fs.mkdirSync('./backup');
!fs.existsSync('./backup/content') && fs.mkdirSync('./backup/content');
!fs.existsSync('./backup/images') && fs.mkdirSync('./backup/images');



const crawler = new Crawler(program.username, { 
  delay: program.delay || 0,
 });

console.log('📙 백업을 시작합니다 / velog-backup')
crawler.parse()
