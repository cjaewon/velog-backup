const fs = require('fs');
const { join } = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const { PostsQuery, PostQuery } = require('./query');

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

class Crawler {
  constructor(username, { delay, cert, withDetail }) {
    this.username = username; 

    if (!username) {
      console.error('❌ 유저이름을 입력해주세요')
      process.exit(1);
    }

    // options
    this.delay = delay;
    this.cert = cert;
    this.withDetail = withDetail;

    this.__grahpqlURL = 'https://v2.velog.io/graphql';
    this.__headers = {
      ...DEFAULT_HEADERS,
      ...(cert ? { Cookie: `access_token=${cert};` } : {}),
    };
  }

  async __request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { ...this.__headers, ...options.headers },
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.response = { status: response.status };
      throw error;
    }
    
    return response;
  }

  async parse() {
    const posts = await this.getPosts();
    
    await Promise.all(posts.map(async(postInfo, i) => { 
      if (this.delay > 0) await new Promise(r => setTimeout(r, this.delay * i));

      let post = await this.getPost(postInfo.url_slug);
      if (!post) {
        console.log(`⚠️  " ${postInfo.url_slug} " 가져올 수 없는 글을 건너뛰었습니다.`);
        return;
      }

      post.body = await this.getImage(post.body);

      await this.writePost(post);
      console.log(`✅ " ${post.title} " 백업 완료`);
    }));
  }

  async getPosts() {
    const url = `https://velog.io/@${this.username}`;
    let response;
    let posts = [];

    try {
      await this.__request(url);
    } catch (e) {
      if (e.response?.status === 404) {
        console.error(`⚠️  해당 유저를 찾을 수 없어요 \n username = ${this.username}`);
      } else {
        console.error(e);
      }

      process.exit(1);
    }

    while (true) {
      try {
        if (response && response.data.posts.length >= 20) {
          response = await this.__request(this.__grahpqlURL, {
            method: 'POST',
            body: JSON.stringify(PostsQuery(this.username, posts[posts.length - 1].id)),
          });

          response = await response.json();
        } else {
          response = await this.__request(this.__grahpqlURL, {
            method: 'POST',
            body: JSON.stringify(PostsQuery(this.username)),
          });
          
          response = await response.json();
        }
      } catch(e) {
        console.error(`⚠️  벨로그에서 글 목록을 가져오는데 실패했습니다. \n error = ${e}`);
        process.exit(1);
      }
      
      posts = [...posts, ...response.data.posts];
      if (response.data.posts.length < 20) break;
    }

    console.log(`✅ ${this.username}님의 모든 글(${posts.length} 개) 을 가져옴`);

    return posts;
  }

  async getPost(url_slug) {
    let response;

    try {
      response = await this.__request(this.__grahpqlURL, {
        method: 'POST',
        body: JSON.stringify(PostQuery(this.username, url_slug)),
      });
      response = await response.json();
    } catch (e) {
      console.error(`⚠️  벨로그에서 글을 가져오는데 실패했습니다. \n error = ${e} url = ${url_slug}`);
      process.exit(1);
    }
    
    return response.data.post;
  }

  async writePost(post) {
    const excludedChar = ['\\\\', '/', ':' ,'\\*' ,'\\?' ,'"' ,'<' ,'>' ,'\\|'];
    let title = post.title;

    for (const char of excludedChar) {
      const re = new RegExp(char, 'g');
      title = title.replace(re, '');
    }

    const path = join('backup', 'content', `${title}.md`);
    let frontmatter = '---\n'
                    + `title: "${post.title}"\n`
                    + `description: "${post.short_description.replace(/\n/g, ' ')}"\n`
                    + `date: ${post.released_at}\n`
                    + `tags: ${JSON.stringify(post.tags)}\n`;
    
    if (this.withDetail) {
      if (post.thumbnail) {
        const thumbnail_file_src = await this.getThumbnailImage(post.thumbnail);

        frontmatter += `thumbnail: ${thumbnail_file_src}\n`;
      }

      if (post.series) {
        frontmatter = frontmatter
            + `series:\n`
            + `  id: ${post.series.id}\n`
            + `  name: ${post.series.name}\n`;
      }
    }

    frontmatter += '---\n';
    post.body = frontmatter + post.body;

    try {
      await fs.promises.writeFile(path, post.body, 'utf8');
    } catch (e) {
      console.error(`⚠️ 파일을 쓰는데 문제가 발생했습니다. / error = ${e}  title = ${post.title}`);
    }
  }

  async downloadImage(url, path) {
    try {
      const response = await this.__request(encodeURI(decodeURI(url)));
      if (!response.body) throw new Error('response body is empty');
      await pipeline(
        Readable.fromWeb(response.body),
        fs.createWriteStream(path),
      );
    } catch (e) {
      console.error(`⚠️ 이미지를 다운 받는데 오류가 발생했습니다 / url = ${url} , e = ${e}`);
    }
  }

  async getImage(body) {
    const regex = /!\[([^\]]*)\]\((.*?.png|.*?.jpeg|.*?.jpg|.*?.webp|.*?.svg|.*?.gif|.*?.tiff)\s*("(?:.*[^"])")?\s*\)|!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g;
    const downloads = [];

    body = body.replace(regex, (_, alt, url) => {
      if (!url) return;

      const filename = url.replace(/\/\s*$/,'').split('/').slice(-2).join('-').trim();
      const path = join('backup', 'images', decodeURI(filename));
      
      downloads.push(this.downloadImage(url, path));

      return `![${alt}](/images/${filename})`;
    });

    await Promise.all(downloads);
    return body;
  }

  async getThumbnailImage(url) {
    const filename = url.replace(/\/\s*$/,'').split('/').slice(-2).join('-').trim();
    const path = join('backup', 'images', decodeURI(filename));

    await this.downloadImage(url, path);

    return `/images/${filename}`;
  }
};

module.exports = Crawler;
