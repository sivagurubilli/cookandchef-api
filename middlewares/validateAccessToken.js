let { responseJson } = require('../utils/appUtils');
let { Cook, Employer } = require('../models')
const { privateKey } = require("../config/config");
const jwt = require('jsonwebtoken')

//Verification setup for the provided token
exports.validateAccessToken = async (req, res, next) => {

    try {
        let decoded;
        let role;
        let token = req.headers["x-access-token"];
        if (!token) throw { statusCode: 499, msg: "Token missing in headers" }

        jwt.verify(token, privateKey, (err, decodedData) => {
            if (err) {
                if (err.name === 'TokenExpiredError') throw { statusCode: 401, responseCode: 3, msg: "Unauthorized user" }
                else throw { statusCode: 498, msg: "Invalid token" }
            } else decoded = decodedData;
        });

        //Finding the user in All collections
        let user = await Cook.findOne({ _id: decoded.id, status: { $in: [1, 2, 3, 4] } })
        user = JSON.parse(JSON.stringify(user));
        if (!user) {
            user = await Employer.findOne({ _id: decoded.id, status: { $in: [1, 2, 3, 4] } })
            if (!user) throw { statusCode: 401, responseCode: 3, msg: "Unauthorized user" }
            user = JSON.parse(JSON.stringify(user));
            role = "employer";
        }
        user.role = (role) ? role : "cook";
        if (user && user.status == 3) throw { statusCode: 500, responseCode: 4, msg: "Your account is suspended.Contact support team" }
        req.user = user;
        next();
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Session Timed Out.Try again', e))
    }
};