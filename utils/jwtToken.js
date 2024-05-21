const sendToken =async (user, statusCode, res, msg = '') => {
    const token = await user.generateToken()
    console.log(token)
    res.status(statusCode).cookie('token', token, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 60 * 60 * 24 * 15000,
    }).json({ success: true, user, token, msg })
}

export default sendToken