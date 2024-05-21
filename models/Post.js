import mongoose, { Schema, model, Types } from 'mongoose'

const postSchema = new Schema({
    caption: String,
    img: {
        public_id: String,
        url: String
    },
    owner: {
        type: Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: [{
        type: Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: {
            type: Types.ObjectId,
            ref: 'User'
        },
        comment: {
            type: String,
            required: true
        }
    }]
})

export const Post = mongoose.models.Post || model('Post', postSchema)