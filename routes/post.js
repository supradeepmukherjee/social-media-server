import { Router } from 'express'
import { comment, delComment, delPost, getPostOfFollowing, likeUnlikePost } from '../controllers/post.js'

const app = Router()

app.route('/post/:id')
    .put(likeUnlikePost)
    .delete(delPost)
app.get('/posts', getPostOfFollowing)
app.route('/comment/:id')
    .put(comment)
    .delete(delComment)

export default app