const axios = require('axios');
const { join } = require('path');
const fs = require('fs').promises;

const { PostsQuery, PostQuery } = require('./query');

class Crawler {
  constructor(username) {
    this.username = username;

    this.__grahpqlURL = 'https://v2.velog.io/graphql';
  }

  async parse() {
    const posts = await this.getPosts();
    
    posts.map(async(postInfo, i) => {
      const post = await this.getPost(postInfo.url_slug);

      await this.writePost(post);
      console.log(`✅ " ${post.title} " 백업 (${i + 1}/${posts.length})`);
    });

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
      response = await axios.post(this.__grahpqlURL, PostsQuery(this.username));
    } catch(e) {
      console.error(`⚠️  벨로그에서 글 목록을 가져오는데 실패했습니다. \n error = ${e}`);
      process.exit(1);
    }
  
    const posts = response.data.data.posts;

    console.log(`✅ ${this.username}님의 모든 글(${posts.length} 개) 을 가져옴`);

    return posts;
  }

  async getPost(url_slug) {
    let response;

    try {
      response = await axios.post(this.__grahpqlURL, PostQuery(this.username, url_slug));
    } catch (e) {
      console.error(`⚠️  벨로그에서 글을 가져오는데 실패했습니다. \n error = ${e}`);
      process.exit(1);
    }
    
    return response.data.data.post;
  }

  async writePost(post) {
    const path = join('./backup', `${post.title}.md`);

    post.body = '---\n'
                + `title: "${post.title}"\n`
                + `description: "${post.short_description.replace(/\n/g, ' ')}"\n`
                + `date: ${post.released_at}\n`
                + `tags: ${JSON.stringify(post.tags)}\n`
                + '---\n' + post.body;
                
    await fs.writeFile(path, post.body, 'utf8');
  }


};

module.exports = Crawler;