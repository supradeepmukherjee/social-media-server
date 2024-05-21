import { Router } from 'express'
import { deleteProfile, follow, forgotPassword, getAllUsers, getMyPosts, getUserPosts, getUserProfile, login, logout, myProfile, register, resetPassword, updateCaption, updatePassword, updateProfile, createPost } from '../controllers/user.js'
import { isAuthenticated } from '../middlewares/auth.js'
import upload from '../middlewares/multer.js'

const app = Router()

app.post('/register', upload, register)
app.post('/login', login)
app.get('/logout', logout)
app.post('/forgotpassword', forgotPassword)
app.put('/resetpassword/:token', resetPassword)

app.use(isAuthenticated)
app.post('/upload', upload, createPost)
app.get('/myProfile', myProfile)
app.put('/follow/:id', follow)
app.put('/update/password', updatePassword)
app.put('/update/profile', upload, updateProfile)
app.delete('/del', deleteProfile)
app.get('/all', getAllUsers)
app.get('/profile/:user', getUserProfile)
app.get('/my-posts', getMyPosts)
app.get('/user-posts/:id', getUserPosts)
app.put('/update-caption/:id', updateCaption)

export default app