const axios = require('axios');
const { PostQuery } = require('./query');

class Crawler {
  constructor(username) {
    this.username = username;
    this.__grahpqlURL = 'https://v2.velog.io/graphql';
  }

  async parse() {
    const posts = await this.getPosts();
  }

  async getPosts() {
    const url = `https://velog.io/@${this.username}`;
    let response;

    try {
      await axios.get(url);
    } catch (e) {
      if (e.response.status === 404) {
        console.error(`⚠️  해당 유저를 찾을 수 없어요 \n username = ${this.username}`);
        process.exit(1);
      }

      console.error(e);
    }

    try {
      response = await axios.post(this.__grahpqlURL, PostQuery(this.username));
    } catch(e) {
      console.error(`⚠️  벨로그에서 글을 가져오는데 실패했습니다. \n error = ${e}`);
      process.exit(1);
    }
  
    const posts = response.data.data.posts;

    console.log(`✅ ${this.username}님의 모든 글(${posts.length} 개) 을 가져옴`);

    return response.data;
  }
};

module.exports = Crawler;