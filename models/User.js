import mongoose, { Schema, Types, model } from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomBytes, createHash } from 'crypto'

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, "Please enter a name"]
    },
    chavi: {
        public_id: String,
        url: String
    },
    email: {
        type: String,
        required: [true, "Please enter a email"],
        unique: [true, 'Email already exists']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minLength: [true, 'Password must be atleast 6 characters long'],
        select: false
    },
    posts: [{
        type: Types.ObjectId,
        ref: 'Post'
    }],
    followers: [{
        type: Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: Types.ObjectId,
        ref: 'User'
    }],
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
})

userSchema.pre('save', async function (next) {
    console.log(this);
    if (!this.isModified('password')) next()
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateToken = async function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET)
}
userSchema.methods.getResetPasswordToken = async function () {
    const resetToken = randomBytes(20).toString('hex')
    console.log(resetToken)
    this.resetPasswordToken = createHash('sha256').update(resetToken).digest('hex')
    this.resetPasswordExpiry = Date.now() + 600000
    return resetToken
}

export const User = mongoose.models.User || model('User', userSchema)