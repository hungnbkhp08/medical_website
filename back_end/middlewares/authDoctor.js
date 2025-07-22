import jwt from 'jsonwebtoken';

// admin authentication middleware
const authDoctor = async (req, res, next) => {
    try {
        const {dtoken} = req.headers;
        if (!dtoken) {
            return res.json({ success: false, message: "Unauthorized access" });
        }
        const decoded = jwt.verify(dtoken, process.env.JWT_SECRET);
               req.body.docId=decoded.id
        next();
    } catch (error) {
        console.error( error);
        res.json({ success: false, message: error.message });
    }
};
export default authDoctor;