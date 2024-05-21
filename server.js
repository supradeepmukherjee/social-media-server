import app from './app.js';
import connectDatabase  from './config/database.js';
import { v2 } from 'cloudinary';

connectDatabase()

v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_SECRET,
})

app.listen(process.env.PORT, () => console.log(process.env.PORT))