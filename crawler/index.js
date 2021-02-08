const axios = require('axios');
const fs = require('fs');
const { join } = require('path');

const { PostsQuery, PostQuery } = require('./query');

class Crawler {
  constructor(username, { delay }) {
    this.username = username; 

    // options
    this.delay = delay;

    this.__grahpqlURL = 'https://v2.velog.io/graphql';
  }

  async parse() {
    const posts = await this.getPosts();
    
    posts.map(async(postInfo, i) => { 
      if (this.delay > 0) await new Promise(r => setTimeout(r, this.delay * i));

      let post = await this.getPost(postInfo.url_slug);
      post.body = await this.getImage(post.body);

      await this.writePost(post);
      console.log(`✅ " ${post.title} " 백업 완료`);
    });
  }

  async getPosts() {
    const url = `https://velog.io/@${this.username}`;
    let response;
    let posts = [];

    try {
      await axios.get(url);
    } catch (e) {
      if (e.response.status === 404) {
        console.error(`⚠️  해당 유저를 찾을 수 없어요 \n username = ${this.username}`);
        process.exit(1);
      }

      console.error(e);
    }

    while (true) {
      try {
        if (response && response.data.data.posts.length >= 20) {
          response = await axios.post(this.__grahpqlURL, PostsQuery(this.username, posts[posts.length - 1].id));
        } else {
          response = await axios.post(this.__grahpqlURL, PostsQuery(this.username));
        }
      } catch(e) {
        console.error(`⚠️  벨로그에서 글 목록을 가져오는데 실패했습니다. \n error = ${e}`);
        process.exit(1);
      }
      
      posts = [...posts, ...response.data.data.posts];
      if (response.data.data.posts.length < 20) break;
    }

    console.log(`✅ ${this.username}님의 모든 글(${posts.length} 개) 을 가져옴`);

    return posts;
  }

  async getPost(url_slug) {
    let response;

    try {
      response = await axios.post(this.__grahpqlURL, PostQuery(this.username, url_slug));
    } catch (e) {
      console.error(`⚠️  벨로그에서 글을 가져오는데 실패했습니다. \n error = ${e} url = ${url_slug}`);
      process.exit(1);
    }
    
    return response.data.data.post;
  }

  async writePost(post) {
    const path = join('backup', 'content', `${post.title.replace(/\//g, ' ').replace(':','-')}.md`);

    post.body = '---\n'
                + `title: "${post.title}"\n`
                + `description: "${post.short_description.replace(/\n/g, ' ')}"\n`
                + `date: ${post.released_at}\n`
                + `tags: ${JSON.stringify(post.tags)}\n`
                + '---\n' + post.body;
                
    await fs.promises.writeFile(path, post.body, 'utf8');
  }

  async getImage(body) {
    const regex = /!\[[^\]]*\]\((.*?.png|.jpeg|.jpg|.webp|.svg|.gif|.tiff)\s*("(?:.*[^"])")?\s*\)|!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g;
    
    body = body.replace(regex, (_, url) => {
      if (!url) return;

      const filename = url.replace(/\/\s*$/,'').split('/').slice(-2).join('-').trim();
      const path = join('backup', 'images', decodeURI(filename));
      
      axios({
        method: 'get',
        url: encodeURI(decodeURI(url)),
        responseType: 'stream',
      })
      .then(resp => resp.data.pipe(fs.createWriteStream(path)))
      .catch(e => console.error(`⚠️ 이미지를 다운 받는데 오류가 발생했습니다 / url = ${url} , e = ${e}`));

      return `![](/images/${filename})`;
    });

    return body;
  }

};

module.exports = Crawler;
