class Crawler {
  constructor(username) {
    this.username = username;
  }

  async parse() {
    const posts = await this.getPosts();
  }

  async getPosts() {
    
  }
};

module.exports = Crawler;