import jwt from 'jsonwebtoken';

// user authentication middleware
const authUser = async (req, res, next) => {
    try {
        const {token} = req.headers;
        if (!token) {
            return res.json({ success: false, message: "Unauthorized access" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
               req.body.userId=decoded.id
        next();
    } catch (error) {
        console.error( error);
        res.json({ success: false, message: error.message });
    }
};
export default authUser;