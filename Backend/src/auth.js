
const { createHash } = require("crypto");
const { pool } = require("./db.js");
const {
    UNEXPECTED,
    SUCCESS,
    NOT_FOUND,
    NOT_AUTH,
    ALREADY_EXISTS,
    INVALID_INPUT
} = require("./error_codes.js");

function computeSHA256(str) {
    return createHash("sha256").update(str).digest("hex");
}

exports.sign_in = function(req, response) {
    const { address, username, password } = req.body;

    if (
        !address || !username || !password ||
        typeof address !== "string" ||
        typeof username !== "string" ||
        typeof password !== "string" ||
        !address.trim() || !username.trim() || !password.trim()
    ) {
        return response.send({
            code: INVALID_INPUT,
            detail: "Please fill in all registration fields.",
            data: null
        });
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(address.trim())) {
        return response.send({
            code: INVALID_INPUT,
            detail: "Please enter a valid email address.",
            data: null
        });
    }

    const cleanAddress = address.trim().toLowerCase();
    const cleanUsername = username.trim();
    const hash = computeSHA256(password);

    pool.query(
        "INSERT INTO users (address, username, hash) VALUES ($1, $2, $3)",
        [cleanAddress, cleanUsername, hash],
        (err) => {
            if (err) {
                console.error("Signup database error:", err);
                if (err.code === "23505") {
                    let message = "This account already exists.";

                    if (err.constraint === "users_pkey") {
                        message = "This email address is already registered.";
                    } else if (err.constraint === "users_username_unique") {
                        message = "This username is already taken.";
                    }

                    return response.send({
                        code: ALREADY_EXISTS,
                        detail: message,
                        data: null
                    });
                }

                return response.send({
                    code: UNEXPECTED,
                    detail: "Unable to create your account right now. Please try again later.",
                    data: null
                });
            }

            req.session.address = cleanAddress;
            req.session.username = cleanUsername;

            req.session.save((saveErr) => {
                if (saveErr) {
                    return response.send({
                        code: UNEXPECTED,
                        detail: "Account created, but unable to complete login. Please log in again.",
                        data: null
                    });
                }

                response.send({
                    code: SUCCESS,
                    detail: "Account created successfully.",
                    data: null
                });
            });
        }
    );
};

exports.login = function(req, response) {
    const { password, address } = req.body;

    if (
        typeof address !== "string" ||
        typeof password !== "string" ||
        !address.trim() ||
        !password
    ) {
        return response.send({
            code: INVALID_INPUT,
            detail: "Please enter your email address and password.",
            data: null
        });
    }

    const cleanAddress = address.trim().toLowerCase();
    const hash = computeSHA256(password);

    pool.query(
        "SELECT username FROM users WHERE hash = $1 AND address = $2",
        [hash, cleanAddress],
        (err, res) => {
            if (err) {
                return response.send({
                    code: UNEXPECTED,
                    detail: "Unable to log in right now. Please try again later.",
                    data: null
                });
            }

            if (res.rows.length === 0) {
                return response.send({
                    code: NOT_FOUND,
                    detail: "Email address or password is incorrect.",
                    data: null
                });
            }

            req.session.address = cleanAddress;
            req.session.username = res.rows[0].username;

            req.session.save((saveErr) => {
                if (saveErr) {
                    return response.send({
                        code: UNEXPECTED,
                        detail: "Unable to complete login. Please try again.",
                        data: null
                    });
                }

                response.send({
                    code: SUCCESS,
                    detail: "Login successful.",
                    data: null
                });
            });
        }
    );
};

exports.fetch_user = function(req, response) {
    if (req.session && req.session.address) {
        return response.send({
            code: SUCCESS,
            detail: "Success",
            data: {
                username: req.session.username,
                address: req.session.address
            }
        });
    }

    response.send({
        code: NOT_AUTH,
        detail: "User not authenticated.",
        data: null
    });
};

exports.delete_user = function(req, response) {
    if (!req.session || !req.session.address) {
        return response.send({
            code: NOT_AUTH,
            detail: "User not authenticated.",
            data: null
        });
    }

    pool.query(
        "DELETE FROM users WHERE address = $1",
        [req.session.address],
        (err) => {
            if (err) {
                return response.send({
                    code: UNEXPECTED,
                    detail: "Unable to delete your account. Please try again later.",
                    data: null
                });
            }

            response.send({
                code: SUCCESS,
                detail: "Account deleted successfully.",
                data: null
            });
        }
    );
};

exports.logout = function(req, response) {
    if (!req.session) {
        return response.send({
            code: NOT_AUTH,
            detail: "User not authenticated.",
            data: null
        });
    }

    req.session.destroy((err) => {
        if (err) {
            return response.send({
                code: UNEXPECTED,
                detail: "Unable to log out. Please try again.",
                data: null
            });
        }

        response.send({
            code: SUCCESS,
            detail: "Logout successful.",
            data: null
        });
    });
};
