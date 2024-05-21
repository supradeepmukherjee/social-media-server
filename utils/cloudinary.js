import { v2 } from 'cloudinary'

const upload = async (f, folder) => {
    try {
        const result = await v2.uploader.upload(`data:${f.mimetype};base64,${f.buffer.toString('base64')}`, { folder })
        return result
    } catch (err) {
        console.log(err)
        throw new Error('Error uploading files to cloudinary', err)
    }
}

export default upload