const { Command } = require('commander');
const Crawler = require('./crawler');

const program = new Command();

program.version('1.0.0');
program.option('-u, --username <username>', 'velog 유저이름');

program.parse(process.argv);

const crawler = new Crawler(program.username);

JSON.stringify(crawler.parse());