var $NzK1A$mongoose = require("mongoose");
var $NzK1A$http = require("http");
var $NzK1A$dotenv = require("dotenv");
var $NzK1A$express = require("express");
var $NzK1A$socketio = require("socket.io");
var $NzK1A$jsonwebtoken = require("jsonwebtoken");
var $NzK1A$morgan = require("morgan");
require("express-session");
var $NzK1A$helmet = require("helmet");
var $NzK1A$expressmongosanitize = require("express-mongo-sanitize");
var $NzK1A$xssclean = require("xss-clean");
var $NzK1A$hpp = require("hpp");
var $NzK1A$compression = require("compression");
var $NzK1A$cors = require("cors");
var $NzK1A$api = require("api");
var $NzK1A$validator = require("validator");
var $NzK1A$bcryptjs = require("bcryptjs");
var $NzK1A$crypto = require("crypto");
var $NzK1A$util = require("util");
var $NzK1A$stripe = require("stripe");





var $8f2b3a924f88db43$exports = {};








var $b714d224dffd3890$exports = {};

var $a934024a8febe747$export$69093b9c569a5b5b;
var $a934024a8febe747$export$7cbf767827cd68ba;
var $a934024a8febe747$export$74ff82ccb88f9fb1;
var $a934024a8febe747$export$64ddf344ab9330e3;
var $a934024a8febe747$export$3493b8991d49f558;
var $a934024a8febe747$export$8ddaddf355aae59c;
var $a934024a8febe747$export$8788023029506852;
var $a934024a8febe747$export$7d0f10f273c0438a;
var $a934024a8febe747$export$e3ac7a5d19605772;
var $147684199319e85e$exports = {};




const $147684199319e85e$var$userSchema = new $NzK1A$mongoose.Schema({
    firstName: {
        type: String,
        required: [
            true,
            "A user must have a first name"
        ],
        trim: true,
        maxlength: [
            20,
            "A user's name must have less or equal then 20 characters"
        ],
        minlength: [
            1,
            "A user's name must have more or equal then 10 characters"
        ]
    },
    lastName: {
        type: String,
        required: [
            true,
            "A user must have a first name"
        ],
        trim: true,
        maxlength: [
            20,
            "A user's name must have less or equal then 20 characters"
        ],
        minlength: [
            1,
            "A user's name must have more or equal then 10 characters"
        ]
    },
    googleID: {
        type: String,
        unique: true
    },
    facebookID: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        required: [
            true,
            "Please provide your email"
        ],
        unique: true,
        lowercase: true,
        validate: [
            $NzK1A$validator.isEmail,
            "Please provide a valid email"
        ]
    },
    phoneNumber: {
        type: String,
        unique: true,
        lowercase: true,
        required: [
            true,
            "Please provide your phoneNumber"
        ],
        validate: [
            $NzK1A$validator.isMobilePhone,
            "Please provide a valid phone number"
        ]
    },
    password: {
        type: String,
        // required: [true, "Please provide a password"],
        minlength: 8
    },
    passwordConfirm: {
        type: String,
        // required: [true, "Please confirm your password"],
        validate: {
            // This only works on CREATE and SAVE!!!
            validator: function(el) {
                return el === this.get("password");
            },
            message: "Passwords are not the same!"
        }
    },
    role: {
        type: String,
        enum: [
            "user",
            "editor",
            "admin"
        ],
        default: "user"
    },
    active: {
        type: Boolean,
        default: true
    },
    customerID: {
        type: String,
        default: null
    },
    photo: {
        type: String,
        default: "An image based on the users name"
    },
    address: String,
    dob: {
        type: Date,
        validate: [
            $NzK1A$validator.isDate,
            "give a valid date of birth"
        ]
    },
    verification: {
        type: Boolean,
        default: false
    },
    registrationDate: {
        type: Date,
        default: new Date()
    },
    cart: [
        {
            type: $NzK1A$mongoose.Schema.ObjectId,
            ref: "Cart"
        }
    ],
    order: [
        {
            type: $NzK1A$mongoose.Schema.ObjectId,
            ref: "Order"
        }
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
$147684199319e85e$var$userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    this.password = await $NzK1A$bcryptjs.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});
$147684199319e85e$var$userSchema.pre("save", function(next) {
    if (!this.isModified("password") || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});
$147684199319e85e$var$userSchema.pre(/^find/, function(next) {
    // this points to the current query
    this.find({
        active: {
            $ne: false
        }
    });
    next();
});
$147684199319e85e$var$userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await $NzK1A$bcryptjs.compare(candidatePassword, userPassword);
};
$147684199319e85e$var$userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};
$147684199319e85e$var$userSchema.methods.createPasswordResetToken = function() {
    function generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000);
    }
    // const resetToken = crypto.randomBytes(32).toString('hex');
    const resetToken = generateVerificationCode().toString();
    this.passwordResetToken = $NzK1A$crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 600000;
    return resetToken;
};
const $147684199319e85e$var$User = $NzK1A$mongoose.model("User", $147684199319e85e$var$userSchema);
$147684199319e85e$exports = $147684199319e85e$var$User;


const $a934024a8febe747$var$filterObj = (obj, ...allowedFields)=>{
    const newObj = {};
    Object.keys(obj).forEach((el)=>{
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};
$a934024a8febe747$export$69093b9c569a5b5b = async (req, res)=>{
    try {
        const users = await $147684199319e85e$exports.find();
        res.status(200).json({
            status: "success",
            results: users.length,
            data: {
                users: users
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$a934024a8febe747$export$7cbf767827cd68ba = async (req, res)=>{
    try {
        const user = await user.find({
            email: req.params.user
        });
        res.status(200).json({
            status: "success",
            data: {
                user: user
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$a934024a8febe747$export$74ff82ccb88f9fb1 = async (req, res)=>{
    try {
        // console.log("here")
        const user = await user.find({
            phoneNumber: req.params.phoneNumber
        });
        // console.log(user)
        if (user.length === 0) res.status(200).json({
            status: "success",
            message: "User doesn't exist"
        });
        else res.status(200).json({
            status: "success",
            data: {
                user: user
            }
        });
        return;
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$a934024a8febe747$export$64ddf344ab9330e3 = async (req, res)=>{
    try {
        // console.log("here")
        const user = await user.find({
            email: req.params.email
        });
        // console.log(user)
        if (user.length === 0) res.status(200).json({
            status: "success",
            message: "User doesn't exist"
        });
        else res.status(200).json({
            status: "success",
            data: {
                user: user
            }
        });
        return;
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$a934024a8febe747$export$3493b8991d49f558 = async (req, res)=>{
    try {
        const newUser = await $147684199319e85e$exports.create(req.body);
        res.status(201).json({
            status: "success",
            data: {
                user: newUser
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$a934024a8febe747$export$8ddaddf355aae59c = async (req, res, next)=>{
    try {
        // 1) Create error if user POSTs password data
        if (req.body.password || req.body.passwordConfirm) return next(res.status(400).json({
            status: "fail",
            message: "'This route is not for password updates. Please use /updateMyPassword.'"
        }));
        // 2) Filtered out unwanted fields names that are not allowed to be updated
        const filteredBody = $a934024a8febe747$var$filterObj(req.body, "name", "email");
        // 3) Update user document
        const user = await user.find({
            email: req.params.user
        });
        const updatedUser = await user.findByIdAndUpdate(user.id, filteredBody, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            status: "success",
            data: {
                user: updatedUser
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$a934024a8febe747$export$8788023029506852 = async (req, res, next)=>{
    try {
        const user = await user.find({
            email: req.params.user
        });
        await user.findByIdAndUpdate(user.id, {
            active: false
        });
        res.status(204).json({
            status: "success",
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$a934024a8febe747$export$7d0f10f273c0438a = async (req, res)=>{
    try {
        const user = await user.find({
            email: req.params.user
        });
        await user.findByIdAndDelete(user[0].id);
        res.status(204).json({
            status: "success",
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$a934024a8febe747$export$e3ac7a5d19605772 = async (req, res)=>{
    try {
        const user = await user.find({
            email: req.params.user
        });
        const updatedUser = await user.findByIdAndUpdate(user[0].id, req.body, {
            new: true,
            runValidators: true
        });
        // user.save()
        res.status(200).json({
            status: "success",
            user: updatedUser
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};


var $ccc4fb44969ec275$export$88d962a279f8d761;
var $ccc4fb44969ec275$export$7200a869094fec36;
var $ccc4fb44969ec275$export$596d806903d1f59e;
var $ccc4fb44969ec275$export$3c24523fb31f9da0;
var $ccc4fb44969ec275$export$e68a990611af5eb2;
var $ccc4fb44969ec275$export$eda7ca9e36571553;
var $ccc4fb44969ec275$export$e1bac762c84d3b0c;
var $ccc4fb44969ec275$export$66791fb2cfeec3e;
var $ccc4fb44969ec275$export$dc726c8e334dd814;
var $ccc4fb44969ec275$export$e2853351e15b7895;




var $ccc4fb44969ec275$require$promisify = $NzK1A$util.promisify;
// const Email = require("./../utils/email");
function $ccc4fb44969ec275$var$generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000);
}
const $ccc4fb44969ec275$var$signToken = (id)=>{
    return $NzK1A$jsonwebtoken.sign({
        id: id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};
$ccc4fb44969ec275$export$88d962a279f8d761 = (user, statusCode, res)=>{
    const token = $ccc4fb44969ec275$var$signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 86400000),
        httpOnly: true
    };
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
    res.cookie("jwt", token, cookieOptions);
    // Remove password from output
    user.password = undefined;
    res.status(statusCode).json({
        status: "success",
        token: token,
        data: {
            user: user
        }
    });
    return token;
};
$ccc4fb44969ec275$export$7200a869094fec36 = async (req, res, next)=>{
    try {
        let newUser;
        newUser = await $147684199319e85e$exports.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm
        });
        const url = "noironmain.com";
        // await new Email(newUser, url).sendWelcome();
        $ccc4fb44969ec275$export$88d962a279f8d761(newUser, 201, res);
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$ccc4fb44969ec275$export$596d806903d1f59e = async (req, res, next)=>{
    try {
        const { email: email, password: password } = req.body;
        if (!email || !password) return res.status(400).json({
            status: "fail",
            message: "Yu have not provided either email address or password"
        });
        const user = await user.findOne({
            email: email
        });
        const correct = await user.correctPassword(password, user.password);
        if (!user || !correct) {
            res.status(401).json({
                status: "fail",
                message: "Incorrect email or password"
            });
            return;
        }
        $ccc4fb44969ec275$export$88d962a279f8d761(user, 200, res);
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$ccc4fb44969ec275$export$3c24523fb31f9da0 = async (req, res, next)=>{
    try {
        const { email: email } = req.body;
        const user = await user.findOne({
            email: email
        });
        if (!user) {
            const newUser = await user.create({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                phoneNumber: req.body.phoneNumber,
                googleID: req.body.googleID,
                facebookID: req.body.facebookID
            });
            $ccc4fb44969ec275$export$88d962a279f8d761(newUser, 201, res);
            return;
        }
        if (user.googleID) {
            if (req.body.googleID === user.googleID) return $ccc4fb44969ec275$export$88d962a279f8d761(user, 201, res);
            else return res.status(400).json({
                status: "fail",
                message: "login with your email again"
            });
        }
        if (user.facebookID) {
            if (req.body.facebookID === user.facebookID) return $ccc4fb44969ec275$export$88d962a279f8d761(user, 201, res);
            else return res.status(400).json({
                status: "fail",
                message: "login with your email again"
            });
        }
        return res.status(400).json({
            status: "fail",
            message: "Login with your email again or use a different route"
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$ccc4fb44969ec275$export$e68a990611af5eb2 = async (req, res, next)=>{
    try {
        const { phoneNumber: phoneNumber } = req.body;
        const user = await user.findOne({
            phoneNumber: phoneNumber
        });
        if (!user) return res.status(400).json({
            status: "fail",
            message: "Login with your email again or use a different route"
        });
        // return res.status(200).json({
        //   status: "success",
        //   message: "you have a user",
        //   data: {
        //     user
        //   }
        // });
        $ccc4fb44969ec275$export$88d962a279f8d761(user, 200, res);
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$ccc4fb44969ec275$export$eda7ca9e36571553 = async (req, res, next)=>{
    // 1) Getting token and check of it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) token = req.headers.authorization.split(" ")[1];
    if (!token) return res.status(400).json({
        status: "fail",
        message: "The token is wrong"
    });
    // 2) Verification token
    // console.log(process.env.JWT_SECRET);
    let decoded;
    try {
        decoded = await $ccc4fb44969ec275$require$promisify($NzK1A$jsonwebtoken.verify)(token, process.env.JWT_SECRET);
    } catch (error) {
        if (error.message === "jwt expired") // console.log("Token expired");
        return res.status(400).json({
            status: "fail",
            message: "The token is wrong"
        });
        else // Handle other JWT verification errors
        return res.status(400).json({
            status: "fail",
            message: "The token is wrong"
        });
    }
    // const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    // console.log("hdiddjddkkkkmjnakdkm");
    // console.log(decoded);
    // console.log("We have it all decoded");
    // 3) Check if user still exists
    const currentUser = await $147684199319e85e$exports.findById(decoded.id);
    // console.log(currentUser);
    if (!currentUser) // console.log("This user doesn't exist so we cannot move on");
    return res.status(401).json({
        status: "fail",
        message: "This user does not exist"
    });
    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) // console.log("The user changed password so we are fucked");
    return res.status(401).json({
        status: "fail",
        message: "User recently changed password! Please login again"
    });
    // GRANT ACCESS TO PROTECTED ROUTE
    // console.log("if we are here, then we are fucking good, so what?");
    req.user = currentUser;
    next();
};
$ccc4fb44969ec275$export$e1bac762c84d3b0c = (...roles)=>{
    return (req, res, next)=>{
        // roles ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) return res.status(403).json({
            status: "fail",
            message: "You do not have permission to perform this action"
        });
        next();
    };
};
$ccc4fb44969ec275$export$66791fb2cfeec3e = async (req, res, next)=>{
    // 1) Get user based on POSTed email
    const user = await user.findOne({
        email: req.body.email
    });
    if (!user) return res.status(404).json({
        status: "fail",
        message: "There is no user with email address."
    });
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({
        validateBeforeSave: false
    });
    // 3) Send it to user's email
    const verificationCode = $ccc4fb44969ec275$var$generateVerificationCode();
    console.log("Verification Code:", verificationCode);
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
    try {
        // await sendEmail({
        //   email: user.email,
        //   subject: "Your password reset token (valid for 10 min)",
        //   message,
        // });
        // await new Email(user, resetToken).sendPasswordReset();
        res.status(200).json({
            status: "success",
            message: "Token sent to email!"
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({
            validateBeforeSave: false
        });
        return res.status(500).json({
            status: "fail",
            message: "There was an error sending the email. Try again later!"
        });
    }
};
$ccc4fb44969ec275$export$dc726c8e334dd814 = async (req, res, next)=>{
    try {
        // 1) Get user based on the token
        const hashedToken = $NzK1A$crypto.createHash("sha256").update(req.params.token).digest("hex");
        const user = await user.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: {
                $gt: Date.now()
            }
        });
        // 2) If token has not expired, and there is user, set the new password
        if (!user) return res.status(400).json({
            status: "fail",
            message: "Token is invalid or has expired"
        });
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        // 3) Update changedPasswordAt property for the user
        // 4) Log the user in, send JWT
        res.status(200).json({
            status: "success",
            // token,
            data: {
                user: user
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: "shit failed"
        });
    }
};
$ccc4fb44969ec275$export$e2853351e15b7895 = async (req, res, next)=>{
    const user = await user.findOne({
        email: req.params.email
    });
    if (!user) return res.status(404).json({
        status: "fail",
        message: "There is no user with email address."
    });
    // 2) If token has not expired, and there is user, set the new password
    if (!user) return res.status(400).json({
        status: "fail",
        message: "This user does not exist"
    });
    const checkPassword = await user.correctPassword(req.body.passwordCurrent, user.password);
    if (!checkPassword) return res.status(401).json({
        status: "fail",
        message: "Y0u entered the wrong password"
    });
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.save();
    try {
        createSendToken(user, 200, res);
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};


const $b714d224dffd3890$var$router = $NzK1A$express.Router();
$b714d224dffd3890$var$router.post("/signup", $ccc4fb44969ec275$export$7200a869094fec36);
$b714d224dffd3890$var$router.post("/login", $ccc4fb44969ec275$export$596d806903d1f59e);
$b714d224dffd3890$var$router.post("/loginWithEmail", $ccc4fb44969ec275$export$3c24523fb31f9da0);
$b714d224dffd3890$var$router.post("/loginWithNumber", $ccc4fb44969ec275$export$e68a990611af5eb2);
$b714d224dffd3890$var$router.post("/forgotPassword", $ccc4fb44969ec275$export$66791fb2cfeec3e);
$b714d224dffd3890$var$router.patch("/resetPassword/:token", $ccc4fb44969ec275$export$dc726c8e334dd814);
$b714d224dffd3890$var$router.patch("/updatePassword/:email", $ccc4fb44969ec275$export$e2853351e15b7895);
$b714d224dffd3890$var$router.route("/")// .get(authController.protect, authController.restrictTo('admin', 'owner'), userController.getAllUsers)
// .get(authController.protect, authController.restrictTo('admin', 'owner'), userController.getAllUsers)
.get($a934024a8febe747$export$69093b9c569a5b5b).post($ccc4fb44969ec275$export$eda7ca9e36571553, $ccc4fb44969ec275$export$e1bac762c84d3b0c("admin", "owner"), $a934024a8febe747$export$3493b8991d49f558);
$b714d224dffd3890$var$router.route("/:user").get($ccc4fb44969ec275$export$eda7ca9e36571553, $ccc4fb44969ec275$export$e1bac762c84d3b0c("admin", "owner"), $a934024a8febe747$export$7cbf767827cd68ba).patch($ccc4fb44969ec275$export$eda7ca9e36571553, $a934024a8febe747$export$e3ac7a5d19605772).patch($ccc4fb44969ec275$export$eda7ca9e36571553, $a934024a8febe747$export$8788023029506852).patch($ccc4fb44969ec275$export$eda7ca9e36571553, $a934024a8febe747$export$8ddaddf355aae59c).delete($ccc4fb44969ec275$export$eda7ca9e36571553, $ccc4fb44969ec275$export$e1bac762c84d3b0c("admin", "owner"), $a934024a8febe747$export$7d0f10f273c0438a);
$b714d224dffd3890$var$router.route("/getNumber/:phoneNumber").get($a934024a8febe747$export$74ff82ccb88f9fb1);
$b714d224dffd3890$var$router.route("/getEmail/:email").get($a934024a8febe747$export$64ddf344ab9330e3);
$b714d224dffd3890$exports = $b714d224dffd3890$var$router;


var $012ab30d84b17a73$exports = {};

var $4ee32c905f6ee46c$export$f2012bafb0501902;
var $4ee32c905f6ee46c$export$9c734a715e6666d0;
var $4ee32c905f6ee46c$export$e2005c9600188ac7;
var $4ee32c905f6ee46c$export$297029b54a55ef2d;
var $4ee32c905f6ee46c$export$8d590d0c8872145e;
var $9e3ae83bddb4ad06$exports = {};


const $9e3ae83bddb4ad06$var$productSchema = new $NzK1A$mongoose.Schema({
    name: {
        type: String,
        required: [
            true,
            "A product must have a name"
        ],
        unique: true,
        trim: true,
        maxlength: [
            150,
            "A tour name must have less or equal then 40 characters"
        ],
        minlength: [
            10,
            "A tour name must have more or equal then 10 characters"
        ]
    },
    category: {
        type: String,
        required: [
            true,
            "A product must always belong to a category"
        ]
    },
    Brand: {
        type: String,
        required: [
            true,
            "A product must always have a brand"
        ]
    },
    stock: {
        type: Number,
        default: 0
    },
    image: {
        type: [
            String
        ],
        default: []
    },
    tags: {
        type: [
            String
        ],
        default: []
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [
            1,
            "Rating must be above 1.0"
        ],
        max: [
            5,
            "Rating must be below 5.0"
        ],
        set: (val)=>Math.round(val * 10) / 10 // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    reviews: {
        type: [
            String
        ],
        default: []
    },
    price: {
        type: Number,
        required: [
            true,
            "A tour must have a price"
        ]
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                // this only points to current doc on NEW document creation
                return val < this.price;
            },
            message: `Discount price (${$9e3ae83bddb4ad06$exports.priceDiscount}) should be below regular price`
        }
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    availability: {
        type: Boolean,
        default: true
    },
    variants: {
        type: [
            String
        ],
        default: []
    }
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
const $9e3ae83bddb4ad06$var$Tour = $NzK1A$mongoose.model("Product", $9e3ae83bddb4ad06$var$productSchema);
$9e3ae83bddb4ad06$exports = $9e3ae83bddb4ad06$var$Tour;


$4ee32c905f6ee46c$export$f2012bafb0501902 = async (req, res)=>{
    try {
        const products = await $9e3ae83bddb4ad06$exports.find();
        res.status(200).json({
            status: "success",
            results: products.length,
            data: {
                products: products
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$4ee32c905f6ee46c$export$9c734a715e6666d0 = async (req, res)=>{
    try {
        const product = await product.create(req.body);
        res.status(201).json({
            status: "success",
            data: {
                product: product
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$4ee32c905f6ee46c$export$e2005c9600188ac7 = async (req, res)=>{
    try {
        const product = await product.findById(req.params.product);
        res.status(200).json({
            status: "success",
            data: {
                product: product
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$4ee32c905f6ee46c$export$297029b54a55ef2d = async (req, res)=>{
    try {
        await $9e3ae83bddb4ad06$exports.findByIdAndDelete(req.params.product);
        res.status(204).json({
            status: "success",
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$4ee32c905f6ee46c$export$8d590d0c8872145e = async (req, res)=>{
    try {
        const product = await product.findByIdAndUpdate(req.params.product, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            status: "success",
            product: product
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};



const $012ab30d84b17a73$var$router = $NzK1A$express.Router();
$012ab30d84b17a73$var$router.route("/").get($4ee32c905f6ee46c$export$f2012bafb0501902).post($ccc4fb44969ec275$export$eda7ca9e36571553, $ccc4fb44969ec275$export$e1bac762c84d3b0c("admin", "owner"), $4ee32c905f6ee46c$export$9c734a715e6666d0);
$012ab30d84b17a73$var$router.route("/:product").get($4ee32c905f6ee46c$export$e2005c9600188ac7).patch($ccc4fb44969ec275$export$eda7ca9e36571553, $ccc4fb44969ec275$export$e1bac762c84d3b0c("admin", "owner"), $4ee32c905f6ee46c$export$8d590d0c8872145e).delete($ccc4fb44969ec275$export$eda7ca9e36571553, $ccc4fb44969ec275$export$e1bac762c84d3b0c("admin", "owner"), $4ee32c905f6ee46c$export$297029b54a55ef2d);
$012ab30d84b17a73$exports = $012ab30d84b17a73$var$router;


var $fcf13605eb8fff46$exports = {};

var $cb78b383250451a9$export$98596c466f7b9045;
var $cb78b383250451a9$export$e42a3d813dd6123f;
var $cb78b383250451a9$export$c3d3086f9027c35a;
var $cb78b383250451a9$export$6b78f3a760f21279;
var $cb78b383250451a9$export$189a68d831f3e4ec;
var $cb78b383250451a9$export$7019c694ef9e681d;
var $051cd1322dcbc403$exports = {};

const $051cd1322dcbc403$var$reviewSchema = new $NzK1A$mongoose.Schema({
    review: {
        type: String,
        required: [
            true,
            "Review can not be empty!"
        ]
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    productID: {
        type: $NzK1A$mongoose.Schema.ObjectId,
        ref: "Product",
        required: [
            true,
            "Review must belong to a Product."
        ]
    },
    userID: {
        type: $NzK1A$mongoose.Schema.ObjectId,
        ref: "User",
        required: [
            true,
            "Review must belong to a user"
        ]
    }
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
const $051cd1322dcbc403$var$Review = $NzK1A$mongoose.model("Review", $051cd1322dcbc403$var$reviewSchema);
$051cd1322dcbc403$exports = $051cd1322dcbc403$var$Review;


$cb78b383250451a9$export$98596c466f7b9045 = async (req, res)=>{
    try {
        const reviews = await $051cd1322dcbc403$exports.find();
        res.status(200).json({
            status: "success",
            results: reviews.length,
            data: {
                reviews: reviews
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$cb78b383250451a9$export$e42a3d813dd6123f = async (req, res)=>{
    try {
        const userID = req.user.id;
        const productID = req.body.productID;
        if (!req.user) return res.status(400).json({
            status: "fail",
            message: "You have to be loggedIn to make a review"
        });
        if (!req.user.order.includes(productID)) return res.status(400).json({
            status: "fail",
            message: "You are trying to write a review for a product you have not purchased"
        });
        const existingReview = await review.findOne({
            userID: userID,
            productID: productID
        });
        if (existingReview) return res.status(400).json({
            status: "fail",
            message: "You have already provided a review for this product."
        });
        const review = await review.create({
            ...req.body,
            userID: req.user.id
        });
        res.status(201).json({
            status: "success",
            data: {
                review: review
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$cb78b383250451a9$export$c3d3086f9027c35a = async (req, res)=>{
    try {
        const review = await review.findById(req.params.review);
        res.status(200).json({
            status: "success",
            data: {
                review: review
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$cb78b383250451a9$export$6b78f3a760f21279 = async (req, res)=>{
    try {
        const userReviews = await $051cd1322dcbc403$exports.find({
            userID: req.params.userReviews
        });
        res.status(200).json({
            status: "success",
            results: userReviews.length,
            data: {
                reviews: userReviews
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$cb78b383250451a9$export$189a68d831f3e4ec = async (req, res)=>{
    try {
        await $051cd1322dcbc403$exports.findByIdAndDelete(req.params.review);
        res.status(204).json({
            status: "success",
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$cb78b383250451a9$export$7019c694ef9e681d = async (req, res)=>{
    try {
        const review = await review.findByIdAndUpdate(req.params.review, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            status: "success",
            review: review
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};



const $fcf13605eb8fff46$var$router = $NzK1A$express.Router();
$fcf13605eb8fff46$var$router.route("/").get($cb78b383250451a9$export$98596c466f7b9045).post($ccc4fb44969ec275$export$eda7ca9e36571553, $cb78b383250451a9$export$e42a3d813dd6123f);
// router.route("/:userReviews").get(reviewController.getUserReview)
$fcf13605eb8fff46$var$router.route("/:review").get($cb78b383250451a9$export$c3d3086f9027c35a)// .patch(authController.protect, reviewController.updateReview)
.delete($ccc4fb44969ec275$export$eda7ca9e36571553, $ccc4fb44969ec275$export$e1bac762c84d3b0c("admin", "owner"), $cb78b383250451a9$export$189a68d831f3e4ec);
$fcf13605eb8fff46$exports = $fcf13605eb8fff46$var$router;


var $d6abea13df282ba5$exports = {};



var $a444e65bda0712f9$export$5356c794ca35a1bc;
var $a444e65bda0712f9$export$5529eff0ea94556a;
var $a444e65bda0712f9$export$ba33f6d94de735b7;

const $a444e65bda0712f9$var$stripe = $NzK1A$stripe(process.env.STRIPE_SECRET_KEY);
var $b79b93a2815872bc$exports = {};

const $b79b93a2815872bc$var$orderSchema = new $NzK1A$mongoose.Schema({
    date: {
        type: Date,
        default: Date.now()
    },
    totalPrice: {
        type: Number,
        required: [
            true,
            "An order must always have a price"
        ]
    },
    paymentStatus: {
        type: Boolean,
        default: false
    },
    shippingAddress: {
        type: String,
        required: [
            true,
            "Provide location for the order"
        ]
    },
    orderStatus: {
        type: String,
        enum: [
            "Ready",
            "Processing",
            "Shipped",
            "Delivered",
            "Canceled"
        ],
        default: "Ready"
    },
    paymentMothod: {
        type: String,
        required: [
            true,
            "An order must have a payment method"
        ]
    },
    fulfillmentDate: Date,
    productID: {
        type: $NzK1A$mongoose.Schema.ObjectId,
        ref: "Product",
        required: [
            true,
            "An Order must have a product."
        ]
    },
    userID: {
        type: $NzK1A$mongoose.Schema.ObjectId,
        ref: "User",
        required: [
            true,
            "An Order must belong to a user"
        ]
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    }
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
const $b79b93a2815872bc$var$Order = $NzK1A$mongoose.model("Order", $b79b93a2815872bc$var$orderSchema);
$b79b93a2815872bc$exports = $b79b93a2815872bc$var$Order;



$a444e65bda0712f9$export$5356c794ca35a1bc = async (req, res, next)=>{
    try {
        const user = req.user;
        // console.log("body", req.body)
        let customer;
        if (user.customerID) customer = user.customerID;
        else {
            customer = await $a444e65bda0712f9$var$stripe.customers.create();
            customer = customer.id;
            const updatedUser = await user.findOneAndUpdate({
                _id: user._id
            }, {
                $set: {
                    customerID: customer
                }
            }, {
                new: true
            });
        // console.log(updatedUser)
        }
        const ephemeralKey = await $a444e65bda0712f9$var$stripe.ephemeralKeys.create({
            customer: customer
        }, {
            apiVersion: "2023-10-16"
        });
        const paymentIntent = await $a444e65bda0712f9$var$stripe.paymentIntents.create({
            amount: req.body.amount * 100,
            customer: customer,
            setup_future_usage: "off_session",
            currency: "usd",
            automatic_payment_methods: {
                enabled: true
            }
        });
        // if (paymentIntent) {
        //   const order = await Order.create({ ...req.body, userID: req.user.id });
        //   console.log(order)
        //   const user = await User.findById(order.userID);
        //   user.order.push(order._id);
        //   user.save();
        // }
        // console.log(paymentIntent);
        res.status(200).json({
            status: "success",
            clientSecret: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer
        });
    } catch (err) {
        // console.log(err.message);
        res.status(400).json({
            status: "fail",
            message: "just chill, I have no idea",
            error: err
        });
    }
};
$a444e65bda0712f9$export$5529eff0ea94556a = async (req, res, next)=>{
    try {
        const user = req.user;
        let customer;
        if (user.customerID) customer = user.customerID;
        else {
            customer = await $a444e65bda0712f9$var$stripe.customers.create();
            customer = customer.id;
            const updatedUser = await user.findOneAndUpdate({
                _id: user._id
            }, {
                $set: {
                    customerID: customer
                }
            }, {
                new: true
            });
        // console.log(updatedUser)
        }
        const ephemeralKey = await $a444e65bda0712f9$var$stripe.ephemeralKeys.create({
            customer: customer
        }, {
            apiVersion: "2023-10-16"
        });
        const paymentMethods = await $a444e65bda0712f9$var$stripe.paymentMethods.list({
            customer: customer,
            type: "card"
        });
        // console.log(paymentMethods.data);
        const setupIntent = await $a444e65bda0712f9$var$stripe.setupIntents.create({
            customer: customer,
            // In the latest version of the API, specifying the `automatic_payment_methods` parameter
            // is optional because Stripe enables its functionality by default.
            automatic_payment_methods: {
                enabled: true
            }
        });
        // console.log(setupIntent)
        res.status(200).json({
            status: "success",
            setupIntent: setupIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer
        });
    } catch (err) {
        // console.log(err.message);
        res.status(400).json({
            status: "fail",
            message: "just chill, I have no idea",
            error: err
        });
    }
};
$a444e65bda0712f9$export$ba33f6d94de735b7 = async (req, res, next)=>{
    try {
        const customer = req.user.customerID;
        if (!customer) return res.status(200).json({
            status: "success",
            note: "no card",
            message: "This user doesn't have any payment method set yet"
        });
        const paymentMethods = await $a444e65bda0712f9$var$stripe.paymentMethods.list({
            customer: customer,
            type: "card"
        });
        res.status(200).json({
            status: "success",
            paymentMethods: paymentMethods.data
        });
    // console.log(paymentMethods.data);
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: "just chill, I have no idea",
            error: err
        });
    }
};


const $d6abea13df282ba5$var$router = $NzK1A$express.Router();
// authController.protect,
$d6abea13df282ba5$var$router.post("/checkout-session/", $ccc4fb44969ec275$export$eda7ca9e36571553, $a444e65bda0712f9$export$5356c794ca35a1bc);
$d6abea13df282ba5$var$router.post("/payment-sheet/", $ccc4fb44969ec275$export$eda7ca9e36571553, $a444e65bda0712f9$export$5529eff0ea94556a);
$d6abea13df282ba5$var$router.post("/payment-methods/", $ccc4fb44969ec275$export$eda7ca9e36571553, $a444e65bda0712f9$export$ba33f6d94de735b7);
// router.get('/hello', userController.getAllUsers)
$d6abea13df282ba5$exports = $d6abea13df282ba5$var$router;


var $4f05b78796b5a6a7$exports = {};

var $1330c5f6feda15e0$export$32d5b9ffee639b2a;
var $1330c5f6feda15e0$export$ac29b122ab5923bd;
var $1330c5f6feda15e0$export$4e05eed7f498666c;
var $1330c5f6feda15e0$export$6d123199b9876d55;
var $1330c5f6feda15e0$export$e9d28796bd1be5f2;
var $1330c5f6feda15e0$export$53e589c0d6eae463;
var $1330c5f6feda15e0$export$c0f2cb68152322f1;


$1330c5f6feda15e0$export$32d5b9ffee639b2a = async (req, res)=>{
    try {
        const orders = await $b79b93a2815872bc$exports.find();
        res.status(200).json({
            status: "success",
            results: orders.length,
            data: {
                orders: orders
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$1330c5f6feda15e0$export$ac29b122ab5923bd = async (req, res)=>{
    try {
        const order = await order.create({
            ...req.body,
            userID: req.user.id
        });
        const user = await user.findById(order.userID);
        user.order.push(order._id);
        user.save();
        res.status(201).json({
            status: "success",
            data: {
                order: order
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$1330c5f6feda15e0$export$4e05eed7f498666c = async (req, res)=>{
    try {
        const orderID = req.params.order;
        if (!req.user.order.includes(orderID)) return res.status(400).json({
            status: "fail",
            message: "You are trying to access the orders of another user, that's fucked up bruh"
        });
        const order = await order.findById(req.params.order);
        res.status(200).json({
            status: "success",
            data: {
                order: order
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$1330c5f6feda15e0$export$6d123199b9876d55 = async (req, res)=>{
    try {
        const order = await order.find({
            userID: req.user.id
        });
        res.status(200).json({
            status: "success",
            data: {
                order: order
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$1330c5f6feda15e0$export$e9d28796bd1be5f2 = async (req, res)=>{
    try {
        await $b79b93a2815872bc$exports.findByIdAndDelete(req.params.order);
        res.status(204).json({
            status: "success",
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$1330c5f6feda15e0$export$53e589c0d6eae463 = async (req, res)=>{
    try {
        const order = await order.findByIdAndUpdate(req.params.order, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            status: "success",
            order: order
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$1330c5f6feda15e0$export$c0f2cb68152322f1 = async (req, res, next)=>{
    try {
        const order = await order.findByIdAndUpdate(req.params.order, req.body, {
            new: true,
            runValidators: true
        });
        req.order = order;
        next();
    // res.status(200).json({
    //   status: "success",
    //   order,
    // });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};



// const io = require("../index");
const $4f05b78796b5a6a7$var$router = $NzK1A$express.Router();
$4f05b78796b5a6a7$var$router.route("/").get($ccc4fb44969ec275$export$eda7ca9e36571553, $ccc4fb44969ec275$export$e1bac762c84d3b0c("admin", "owner"), $1330c5f6feda15e0$export$32d5b9ffee639b2a).post($ccc4fb44969ec275$export$eda7ca9e36571553, $1330c5f6feda15e0$export$ac29b122ab5923bd);
$4f05b78796b5a6a7$var$router.route("/get-your-orders").get($ccc4fb44969ec275$export$eda7ca9e36571553, $1330c5f6feda15e0$export$6d123199b9876d55);
$4f05b78796b5a6a7$var$router.route("/:order").get($ccc4fb44969ec275$export$eda7ca9e36571553, $1330c5f6feda15e0$export$4e05eed7f498666c).patch($ccc4fb44969ec275$export$eda7ca9e36571553, $ccc4fb44969ec275$export$e1bac762c84d3b0c("admin", "owner"), $1330c5f6feda15e0$export$53e589c0d6eae463).delete($ccc4fb44969ec275$export$eda7ca9e36571553, $ccc4fb44969ec275$export$e1bac762c84d3b0c("admin", "owner"), $1330c5f6feda15e0$export$e9d28796bd1be5f2);
$4f05b78796b5a6a7$exports = $4f05b78796b5a6a7$var$router;


var $50e49cde49e71aea$exports = {};

var $53dbf1065b43ced2$export$98bb7e7812eecb3d;
var $53dbf1065b43ced2$export$1f96ef276f4967ea;
var $53dbf1065b43ced2$export$3c1cc9429c2b6cf3;
var $53dbf1065b43ced2$export$d4494d185c79f148;
var $53dbf1065b43ced2$export$edba26a5417c3f39;
var $55b2640614f25fa4$exports = {};

const $55b2640614f25fa4$var$cartSchema = new $NzK1A$mongoose.Schema({
    dateUpdate: {
        type: Date,
        default: Date.now()
    },
    totalPrice: {
        type: Number,
        required: [
            true,
            "An order must always have a price"
        ]
    },
    productID: [
        {
            type: $NzK1A$mongoose.Schema.ObjectId,
            ref: "Product",
            required: [
                true,
                "Review must belong to a Product."
            ]
        }
    ],
    userID: {
        type: $NzK1A$mongoose.Schema.ObjectId,
        ref: "User",
        required: [
            true,
            "Review must belong to a user"
        ],
        unique: true
    }
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
const $55b2640614f25fa4$var$Cart = $NzK1A$mongoose.model("Cart", $55b2640614f25fa4$var$cartSchema);
$55b2640614f25fa4$exports = $55b2640614f25fa4$var$Cart;



$53dbf1065b43ced2$export$98bb7e7812eecb3d = async (req, res)=>{
    try {
        const carts = await $55b2640614f25fa4$exports.find();
        res.status(200).json({
            status: "success",
            results: carts.length,
            data: {
                carts: carts
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$53dbf1065b43ced2$export$1f96ef276f4967ea = async (req, res)=>{
    try {
        const cart = await cart.create(req.body);
        const user = await user.findById(cart.userID);
        user.cart.push(cart._id);
        user.save();
        res.status(201).json({
            status: "success",
            data: {
                cart: cart
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$53dbf1065b43ced2$export$3c1cc9429c2b6cf3 = async (req, res)=>{
    try {
        const cart = await cart.findById(req.params.cart);
        res.status(200).json({
            status: "success",
            data: {
                cart: cart
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$53dbf1065b43ced2$export$d4494d185c79f148 = async (req, res)=>{
    try {
        await $55b2640614f25fa4$exports.findByIdAndDelete(req.params.cart);
        res.status(204).json({
            status: "success",
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$53dbf1065b43ced2$export$edba26a5417c3f39 = async (req, res)=>{
    try {
        const cart = await cart.findByIdAndUpdate(req.params.cart, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            status: "success",
            cart: cart
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};



const $50e49cde49e71aea$var$router = $NzK1A$express.Router();
$50e49cde49e71aea$var$router.route("/").get($ccc4fb44969ec275$export$eda7ca9e36571553, $ccc4fb44969ec275$export$e1bac762c84d3b0c("admin", "owner"), $53dbf1065b43ced2$export$98bb7e7812eecb3d).post($ccc4fb44969ec275$export$eda7ca9e36571553, $53dbf1065b43ced2$export$1f96ef276f4967ea);
$50e49cde49e71aea$var$router.route("/:product").get($ccc4fb44969ec275$export$eda7ca9e36571553, $53dbf1065b43ced2$export$3c1cc9429c2b6cf3).patch($ccc4fb44969ec275$export$eda7ca9e36571553, $53dbf1065b43ced2$export$edba26a5417c3f39).delete($ccc4fb44969ec275$export$eda7ca9e36571553, $53dbf1065b43ced2$export$d4494d185c79f148);
$50e49cde49e71aea$exports = $50e49cde49e71aea$var$router;


var $c516c0c8ee3f7c31$exports = {};

var $5b20d2ec1da05489$export$5c5e865177c251a6;
var $5b20d2ec1da05489$export$ffc4e9ae351c37c2;
var $5b20d2ec1da05489$export$55df580668edde54;
var $5b20d2ec1da05489$export$cf7f03c9c3cca5ed;
var $2d52192d9c46d5be$exports = {};

const $2d52192d9c46d5be$var$communicationSchema = new $NzK1A$mongoose.Schema({
    subject: {
        type: String
    },
    body: {
        type: String,
        required: [
            true,
            "A communication must always have a body"
        ]
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    statuts: {
        type: String,
        enum: [
            "resolved",
            "read",
            "in-progress"
        ],
        default: "in-progress"
    },
    communicationType: {
        type: String,
        enum: [
            "email",
            "sms",
            "in-app"
        ]
    },
    userID: {
        type: $NzK1A$mongoose.Schema.ObjectId,
        ref: "User",
        required: [
            true,
            "Review must belong to a user"
        ]
    }
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
const $2d52192d9c46d5be$var$Communication = $NzK1A$mongoose.model("Communication", $2d52192d9c46d5be$var$communicationSchema);
$2d52192d9c46d5be$exports = $2d52192d9c46d5be$var$Communication;


$5b20d2ec1da05489$export$5c5e865177c251a6 = async (req, res)=>{
    try {
        const communication = await communication.find();
        res.status(200).json({
            status: "success",
            results: communication.length,
            data: {
                communication: communication
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$5b20d2ec1da05489$export$ffc4e9ae351c37c2 = async (req, res)=>{
    try {
        const communication = await communication.create(req.body);
        res.status(201).json({
            status: "success",
            data: {
                communication: communication
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};
$5b20d2ec1da05489$export$55df580668edde54 = async (req, res)=>{
    try {
        const communication = await communication.findById(req.params.product);
        res.status(200).json({
            status: "success",
            data: {
                communication: communication
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};
$5b20d2ec1da05489$export$cf7f03c9c3cca5ed = async (req, res)=>{
    try {
        const userCommunications = await $2d52192d9c46d5be$exports.find({
            userID: req.params.userCommunications
        });
        res.status(200).json({
            status: "success",
            results: userCommunications.length,
            data: {
                comms: userCommunications
            }
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err
        });
    }
};


const $c516c0c8ee3f7c31$var$router = $NzK1A$express.Router();
$c516c0c8ee3f7c31$var$router.route("/").get($5b20d2ec1da05489$export$5c5e865177c251a6).post($5b20d2ec1da05489$export$ffc4e9ae351c37c2);
$c516c0c8ee3f7c31$var$router.route("/:userCommunications").get($5b20d2ec1da05489$export$cf7f03c9c3cca5ed);
$c516c0c8ee3f7c31$var$router.route("/:communication").get($5b20d2ec1da05489$export$55df580668edde54);
$c516c0c8ee3f7c31$exports = $c516c0c8ee3f7c31$var$router;




$NzK1A$dotenv.config({
    path: "./config.env"
});

const $8f2b3a924f88db43$var$app = $NzK1A$express();
// Set Security HTTP Headers
$8f2b3a924f88db43$var$app.use($NzK1A$helmet());
// Limit request from same IP address
// const limiter = rateLimit({
//   max: 100,
//   windiwMs: 60 * 60 * 1000,
//   message: "Too many request from this IP, please try again in an hour",
// });
// app.use(limiter);
$8f2b3a924f88db43$var$app.use($NzK1A$cors());
$8f2b3a924f88db43$var$app.use($NzK1A$morgan("dev"));
$8f2b3a924f88db43$var$app.use($NzK1A$express.json());
$8f2b3a924f88db43$var$app.use($NzK1A$expressmongosanitize());
$8f2b3a924f88db43$var$app.use($NzK1A$xssclean());
// Prevent Parameter Pollution
$8f2b3a924f88db43$var$app.use($NzK1A$hpp());
$8f2b3a924f88db43$var$app.use($NzK1A$compression());
$8f2b3a924f88db43$var$app.use((req, res, next)=>{
    req.requestTime = new Date().toISOString();
    console.log(req.requestTime);
    next();
});
$8f2b3a924f88db43$var$app.use("/api/v1/users", $b714d224dffd3890$exports);
$8f2b3a924f88db43$var$app.use("/api/v1/products", $012ab30d84b17a73$exports);
$8f2b3a924f88db43$var$app.use("/api/v1/reviews", $fcf13605eb8fff46$exports);
$8f2b3a924f88db43$var$app.use("/api/v1/payments", $d6abea13df282ba5$exports);
$8f2b3a924f88db43$var$app.use("/api/v1/orders", $4f05b78796b5a6a7$exports);
$8f2b3a924f88db43$var$app.use("/api/v1/cart", $50e49cde49e71aea$exports);
$8f2b3a924f88db43$var$app.use("/api/v1/communications", $c516c0c8ee3f7c31$exports);
// Phone Number verification using TWILIO
// app.get("/getCode/:number", (req, res) => {
//   try {
//     const client = require("twilio")(
//       process.env.TWILIO_ACCOUNTSID,
//       process.env.TWILIO_AUTHTOKEN
//     );
//     client.verify.v2
//       .services(process.env.TWILIO_SERVICE)
//       .verifications.create({ to: req.params.number, channel: "sms" })
//       .then((verification) => console.log(verification.valid));
//     res.status(200).json({
//       status: "success",
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: "fail",
//       message: "just chill, I have no idea",
//       error: err,
//     });
//   }
// });
// app.get("/verifyPhone/:number/:code", async (req, res) => {
//   try {
//     const client = require("twilio")(
//       process.env.TWILIO_ACCOUNTSID,
//       process.env.TWILIO_AUTHTOKEN
//     );
//     const verificationCheck = await client.verify.v2
//       .services(process.env.TWILIO_SERVICE)
//       .verificationChecks.create({
//         to: req.params.number,
//         code: req.params.code,
//       });
//     if (verificationCheck.status === "approved") {
//       res.status(200).json({
//         status: "success",
//         verification: verificationCheck.status,
//       });
//       console.log("Verification successful!");
//     } else {
//       res.status(200).json({
//         status: "fail",
//         verification: verificationCheck.status,
//       });
//       console.log("Verification failed.");
//     }
//   } catch (err) {
//     res.status(400).json({
//       status: "fail",
//       message: "just chill, I have no idea",
//       error: err.message,
//     });
//   }
// });
function $8f2b3a924f88db43$var$smsCallback(error, responseBody) {
    if (error === null) console.log("\nResponse body:\n" + JSON.stringify(responseBody));
    else console.error("Unable to send SMS. Error:\n\n" + error);
}

$8f2b3a924f88db43$var$app.get("/getCode/", (req, res)=>{
    try {
        const TelesignSDK = $8f2b3a924f88db43$import$30b1dbe2b8232c97;
        const customerId1 = process.env.CUSTOMER_ID;
        const apiKey1 = process.env.TELESIGNAPIKEY;
        // const phoneNumber = "6292441577";
        const phoneNumber = "+16156688834";
        const verifyCode = Math.floor(Math.random() * 999999).toString();
        const params = {
            verify_code: verifyCode
        };
        const client = new TelesignSDK(customerId1, apiKey1);
        client.verify.sms($8f2b3a924f88db43$var$smsCallback, phoneNumber, params);
        res.status(200).json({
            status: "success"
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: "just chill, I have no idea",
            error: err
        });
    }
});

$8f2b3a924f88db43$var$app.get("/verifyPhone/", (req, res)=>{
    // try {
    const sdk = $NzK1A$api("@telesign-enterprise/v1.0#jnsb20tlu2wb12v");
    sdk.auth(customerId, apiKey);
    sdk.getVerifyStatus({
        reference_id: "6639DEB2BE4C0A049194D7CEB5B14CE7",
        verify_code: "916193"
    }).then(({ data: data })=>{
        console.log(data);
        res.status(200).json({
            status: "success"
        });
    }).catch((err)=>{
        console.error(err);
        res.status(400).json({
            status: "fail",
            message: "just chill, I have no idea",
            error: err.message
        });
    });
});
//..........................................................................................
$8f2b3a924f88db43$exports = $8f2b3a924f88db43$var$app;


const $e57c0ac6cb09f700$var$server = $NzK1A$http.createServer($NzK1A$express());

const $e57c0ac6cb09f700$var$io = $NzK1A$socketio($e57c0ac6cb09f700$var$server);


$NzK1A$dotenv.config({
    path: "./config.env"
});
let $e57c0ac6cb09f700$var$socketID;
const $e57c0ac6cb09f700$var$identifyUser = (socket, next)=>{
    const token = socket.handshake.auth.token; // Assuming token in handshake
    if (!token) return next(new Error("Unauthorized connection"));
    try {
        const decoded = $NzK1A$jsonwebtoken.verify(token, process.env.JWT_SECRET);
        socket.userID = decoded.id;
        $e57c0ac6cb09f700$var$socketID = decoded.id;
        next();
    } catch (err) {
        return next(new Error("Invalid token"));
    }
};
// Socket.IO setup
$e57c0ac6cb09f700$var$io.use($e57c0ac6cb09f700$var$identifyUser);
$e57c0ac6cb09f700$var$io.on("connection", (socket)=>{
    console.log("A user connected: ", socket.userID);
    socket.emit("update", {
        message: "Now you get to know when the order is complete"
    });
    socket.join(socket.userID);
});
$8f2b3a924f88db43$exports.patch("/api/v1/orders/deliver/:order", $1330c5f6feda15e0$export$c0f2cb68152322f1, (req, res)=>{
    if (req.order.userID.toString() === $e57c0ac6cb09f700$var$socketID) $e57c0ac6cb09f700$var$io.to($e57c0ac6cb09f700$var$socketID).emit("delivered", {
        message: "Your order has been delivered"
    });
    else return res.status(400).json({
        status: "fail",
        message: "This user didn't make this order"
    });
    res.status(200).json({
        status: "success",
        order: req.order
    });
});
$e57c0ac6cb09f700$var$server.listen(process.env.PORT1, ()=>{
    console.log(`Server is running at http://localhost:5000`);
});
const $e57c0ac6cb09f700$var$DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
$NzK1A$mongoose.connect($e57c0ac6cb09f700$var$DB, {
    useNewUrlParser: true,
    dbName: "RoomService"
}).then(()=>console.log("DB connection successful!"));
$8f2b3a924f88db43$exports.listen(process.env.PORT, ()=>{
    console.log(`Server is running at http://localhost:${process.env.PORT}`);
});
module.exports = $e57c0ac6cb09f700$var$io;


//# sourceMappingURL=app.js.map
