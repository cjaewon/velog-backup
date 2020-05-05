const PostQuery = (name) => ({
  operationName:'Posts',
  variables: {
    username: name,
    tag: null
  },

  query: `query Posts($cursor: ID, $username: String, $temp_only: Boolean, $tag: String, $limit: Int) {
    posts(cursor: $cursor, username: $username, temp_only: $temp_only, tag: $tag, limit: $limit) {
      id
      title
      short_description
      thumbnail
      user {
        id
        username
        profile {
          id
          thumbnail
          __typename
        }
        __typename
      }
      url_slug
      released_at
      updated_at
      comments_count
      tags
      is_private
      likes
      __typename
      }
    }`
});


module.exports.PostQuery = PostQuery;