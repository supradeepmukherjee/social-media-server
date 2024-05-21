import { v2 } from 'cloudinary'
import crypto from 'crypto'
import { tryCatch } from '../middlewares/error.js'
import sendEmail from '../middlewares/sendEmail.js'
import { Post } from '../models/Post.js'
import { User } from '../models/User.js'
import upload from '../utils/cloudinary.js'
import sendToken from '../utils/jwtToken.js'
import { ErrorHandler } from '../utils/utility.js'

const createPost = tryCatch(async (req, res) => {
    const user = await User.findById(req.user._id)
    if (!user) return next(new ErrorHandler(404, 'User not Found'))
    const myCloud = await upload(req.file, 'posts')
    const newPostData = {
        caption: req.body.caption,
        img: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        },
        owner: req.user.id
    }
    const newPost = await Post.create(newPostData)
    user.posts.unshift(newPost._id)
    await user.save()
    res.status(201).json({ success: true, msg: 'New post created' })
})

const register = tryCatch(async (req, res, next) => {
    const { name, email, password } = req.body
    let user = await User.findOne({ email })
    if (user) return next(new ErrorHandler(400, 'User already exists'))
    const myCloud = await upload(req.file, 'Chavi')
    user = await User.create({
        name,
        email,
        password,
        chavi:
        {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }
    })
    sendToken(user, 201, res, 'Registered Successfully')
})

const login = tryCatch(async (req, res) => {
    const { email, password } = req.body
    // const user = await User.findOne({ email }).select('+password')
    const user = await User.findOne({ email }).select('+password').populate('posts followers following')
    if (!user) return next(new ErrorHandler(404, 'User doesn\'t exist'))
    const isMatch = await user.matchPassword(password)
    if (!isMatch) return next(new ErrorHandler(400, 'User or Password is incorrect'))
    sendToken(user, 201, res, `Welcome back, ${user.name}`)
})

const follow = tryCatch(async (req, res) => {
    const userToFollow = await User.findById(req.params.id)
    const loggedIn = await User.findById(req.user._id)
    if (!userToFollow) return next(new ErrorHandler(404, 'User not found'))
    if (loggedIn.following.includes(userToFollow._id)) {
        const indexOfFollowing = loggedIn.following.indexOf(userToFollow)
        const indexOfFollower = userToFollow.followers.indexOf(userToFollow)
        loggedIn.following.splice(indexOfFollowing, 1)
        userToFollow.followers.splice(indexOfFollower, 1)
        await loggedIn.save()
        await userToFollow.save()
        return res.status(200).json({ success: true, msg: 'User removed from your follow list' })
    }
    loggedIn.following.push(userToFollow._id)
    userToFollow.followers.push(loggedIn._id)
    await loggedIn.save()
    await userToFollow.save()
    res.status(200).json({ success: true, msg: 'User added to your follow list' })
})

const logout = tryCatch(async (req, res) => {
    res.status(200).cookie('token', null, { expires: new Date(Date.now()), httpOnly: true }).json({ success: true, msg: 'Logged Out' })
})

const updatePassword = tryCatch(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password')
    if (!user) return next(new ErrorHandler(404, 'User doesn\'t exist'))
    const { old, newP } = req.body
    if (!old || !newP) return next(new ErrorHandler(400, "Please provide old & new password"))
    const isMatch = await user.matchPassword(old)
    if (!isMatch) return next(new ErrorHandler(400, 'Old password entered is incorrect'))
    user.password = newP
    await user.save()
    res.status(200).json({ success: true, msg: 'Password changed successfully' })
})

const updateProfile = tryCatch(async (req, res) => {
    const user = await User.findById(req.user._id)
    if (!user) return next(new ErrorHandler(404, 'User doesn\'t exist'))
    const { name, email, chavi } = req.body
    if (name) user.name = name
    if (email) user.email = email
    if (chavi) {
        await v2.uploader.destroy(user.chavi.public_id)
        const myCloud = await upload(req, file, 'Chavi')
        user.chavi.public_id = myCloud.public_id
        user.chavi.url = myCloud.secure_url
        // We do this only when user wants to update chavi, hence chavi initial value is empty & to show old chavi we have made oldChavi
    }
    await user.save()
    res.status(200).json({ success: true, msg: 'Profile updated successfully' })
})

const deleteProfile = tryCatch(async (req, res) => {
    const user = await User.findById(req.user._id).populate('posts')
    if (!user) return next(new ErrorHandler(404, 'User doesn\'t exist'))
    const posts = user.posts
    const followers = user.followers
    const following = user.following
    // removing chavi from cloudinary
    await v2.uploader.destroy(user.chavi.public_id)
    // delete all posts of user
    for (let i = 0; i < posts.length; i++) {
        await v2.uploader.destroy(posts[i].img.public_id)
        await Post.deleteOne({ _id: posts[i]._id })
    }
    // remove user from follower's following
    for (let i = 0; i < followers.length; i++) {
        const follower = await User.findById(followers[i])
        const index = follower.following.indexOf(user._id)
        follower.following.splice(index, 1)
        await follower.save()
    }
    // remove user from following's follower
    for (let i = 0; i < following.length; i++) {
        const follows = await User.findById(following[i])
        const index = follows.followers.indexOf(user._id)
        follows.followers.splice(index, 1)
        await follows.save()
    }
    // remove all comments of the user from all posts
    const postsOfOthers = await Post.find()
    for (let i = 0; i < postsOfOthers.length; i++) {
        const post = await Post.findById(postsOfOthers[i]._id)
        for (let j = 0; j < post.comments.length; j++) {
            if (post.comments[j].user === user._id) {
                post.comments.splice(j, 1)
            }
        }
        await post.save()
    }
    // remove all likes of the user from all posts
    for (let i = 0; i < postsOfOthers.length; i++) {
        const post = await Post.findById(postsOfOthers[i]._id)
        for (let j = 0; j < post.likes.length; j++) {
            if (post.likes[j] === user._id) {
                post.likes.splice(j, 1)
            }
        }
        await post.save()
    }
    await User.deleteOne({ _id: user._id })
    // logout user after deleting profile
    res.cookie('token', null, { expires: new Date(Date.now()), httpOnly: true })
    res.status(200).json({ success: true, msg: 'Profile deleted successfully' })
})

const myProfile = tryCatch(async (req, res) => {
    const user = await User.findById(req.user._id).populate('posts following followers')
    res.status(200).json({ success: true, user, msg: 'User fetched successfully' })
})

const getUserProfile = tryCatch(async (req, res) => {
    const user = await User.findById(req.params.user).populate('posts following followers')
    if (!user) return next(new ErrorHandler(404, 'User doesn\'t exist'))
    res.status(200).json({ success: true, user, msg: 'Profile fetched successfully' })
})

const getAllUsers = tryCatch(async (req, res) => {
    const users = await User.find({ name: { $regex: req.query.name, $options: 'i' } })
    res.status(200).json({ success: true, users, msg: 'Profiles fetched successfully' })
})

const forgotPassword = tryCatch(async (req, res) => {
    const user = await User.findOne({ email: req.body.email })
    if (!user) return next(new ErrorHandler(404, 'User doesn\'t exist'))
    const resetPasswordToken = await user.getResetPasswordToken()
    await user.save()
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/resetpassword/${resetPasswordToken}`
    const text = `Reset your password by clicking on the link below:\n\n ${resetUrl}`
    try {
        await sendEmail({ to: user.email, subject: 'Reset your password', text })
        res.status(200).json({ success: true, msg: `email sent to ${user.email}` })
    } catch (err) {
        console.log(err);
        user.resetPasswordToken = undefined
        user.resetPasswordExpiry = undefined
        await user.save()
        res.status(500).json({ success: false, msg: err.msg })
    }
})

const resetPassword = tryCatch(async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({ resetPasswordToken, resetPasswordExpiry: { $gt: Date.now() } })
    if (!user) return next(new ErrorHandler(401, 'Token is invalid or has expired'))
    user.resetPasswordToken = undefined
    user.resetPasswordExpiry = undefined
    user.password = req.body.password
    await user.save()
    res.status(200).json({ success: true, msg: 'Password updated successful' })
})

const getMyPosts = tryCatch(async (req, res) => {
    const user = await User.findById(req.user._id)
    const posts = []
    for (let i = 0; i < user.posts.length; i++) {
        const post = await Post.findById(user.posts[i]).populate('likes comments.user owner')
        posts.push(post)
    }
    res.status(200).json({ success: true, posts })
})

const getUserPosts = tryCatch(async (req, res) => {
    const user = await User.findById(req.params.id)
    const posts = []
    for (let i = 0; i < user.posts.length; i++) {
        const post = await Post.findById(user.posts[i]).populate('likes comments.user owner')
        posts.push(post)
    }
    res.status(200).json({ success: true, posts })
})

const updateCaption = tryCatch(async (req, res) => {
    const post = await Post.findById(req.params.id)
    if (!post) return next(new ErrorHandler(404, 'Post not Found'))
    if (post.owner.toString() != req.user._id.toString()) return next(new ErrorHandler(401, 'Don\'t edit other person\'s post'))
    post.caption = req.body.caption
    await post.save()
    res.status(200).json({ success: true, msg: 'Caption updated' })
})

export { createPost, deleteProfile, follow, forgotPassword, getAllUsers, getMyPosts, getUserPosts, getUserProfile, login, logout, myProfile, register, resetPassword, sendEmail, updateCaption, updatePassword, updateProfile }
