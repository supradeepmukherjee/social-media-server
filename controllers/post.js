import { v2 } from 'cloudinary'
import { tryCatch } from '../middlewares/error.js'
import { Post } from '../models/Post.js'
import { User } from '../models/User.js'
import { ErrorHandler } from '../utils/utility.js'
import upload from '../utils/cloudinary.js'

const likeUnlikePost = tryCatch(async (req, res, next) => {
    const post = await Post.findById(req.params.id)
    if (!post) return next(new ErrorHandler(404, 'Post not found'))
    if (post.likes.includes(req.user._id)) {
        const index = post.likes.indexOf(req.user._id)
        post.likes.splice(index, 1)
        await post.save()
        return res.status(200).json({ success: true, msg: 'Post unliked' })
    }
    post.likes.push(req.user._id)
    await post.save()
    res.status(200).json({ success: true, msg: 'Post liked' })
})

const delPost = tryCatch(async (req, res, next) => {
    const post = await Post.findById(req.params.id)
    if (!post) return next(new ErrorHandler(404, 'Post not found'))
    if (post.owner.toString() != req.user._id.toString()) return next(new ErrorHandler(401, 'Don\'t delete other person\'s post'))
    await v2.uploader.destroy(post.img.public_id)
    await Post.deleteOne({ _id: post._id })
    const user = await User.findById(req.user._id)
    const index = user.posts.indexOf(req.params.id)
    user.posts.splice(index, 1)
    await user.save()
    res.status(200).json({ success: true, msg: 'Post deleted' })
})

const getPostOfFollowing = tryCatch(async (req, res, next) => {
    const user = await User.findById(req.user._id)
    if (!user) return next(new ErrorHandler(404, 'User not Found'))
    const posts = await Post.find({ owner: { $in: user.following } }).populate('owner likes comments.user')
    res.status(200).json({ success: true, posts: posts.reverse() })
})

const comment = tryCatch(async (req, res, next) => {
    const post = await Post.findById(req.params.id)
    if (!post) return next(new ErrorHandler(404, 'Post not found'))
    let exists = -1
    // checking if comment already exists
    post.comments.forEach((comment, index) => {
        if (comment.user.toString() == req.user._id.toString()) exists = index
    })
    if (exists >= 0) {
        post.comments[exists].comment = req.body.comment
        await post.save()
        res.status(200).json({ success: true, post, msg: 'Comment edited' })
    } else {
        post.comments.push({ user: req.user._id, comment: req.body.comment })
        await post.save()
        res.status(200).json({ success: true, post, msg: 'Comment added' })
    }
})

const delComment = tryCatch(async (req, res, next) => {
    const post = await Post.findById(req.params.id)
    if (!post) return next(new ErrorHandler(404, 'Post not found'))
    // checking if owner wants to delete
    if (post.owner.toString() == req.user._id.toString()) {
        if (req.body.commentID == undefined) return next(new ErrorHandler(400, 'Comment ID required'))
        post.comments.forEach((comment, index) => {
            if (comment._id.toString() == req.body.commentID.toString()) return post.comments.splice(index, 1)
        })
        await post.save()
        res.status(200).json({ success: true, msg: 'A Comment under your post has been deleted' })
    } else {
        post.comments.forEach((comment, index) => {
            if (comment.user.toString() == req.user._id.toString()) return post.comments.splice(index, 1)
        })
        await post.save()
        res.status(200).json({ success: true, msg: 'Your Comment has been deleted' })
    }
})

export { comment, delComment, delPost, getPostOfFollowing, likeUnlikePost }
