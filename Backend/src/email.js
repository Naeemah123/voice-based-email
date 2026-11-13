
const { SUCCESS, NOT_AUTH, UNEXPECTED, INVALID_INPUT } = require("./error_codes.js");
const { pool } = require("./db.js");

exports.fetch_emails = function(req, response) {
    if (!req.session || !req.session.address) {
        return response.send({
            code: NOT_AUTH,
            detail: "User not authenticated.",
            data: null
        });
    }

    const search = req.body.search;

    let query;
    let detail;

    if (search === "SENT") {
        query = "SELECT recipient AS target, subject, content FROM sent_emails WHERE sender = $1";
        detail = "Unable to load sent emails. Please try again.";
    } else if (search === "INBOX") {
        query = "SELECT sender AS target, subject, content FROM received_emails WHERE recipient = $1";
        detail = "Unable to load inbox emails. Please try again.";
    } else {
        return response.send({
            code: INVALID_INPUT,
            detail: "Invalid email folder selected.",
            data: null
        });
    }

    pool.query(query, [req.session.address], (err, res) => {
        if (err) {
            return response.send({
                code: UNEXPECTED,
                detail: detail,
                data: null
            });
        }

        response.send({
            code: SUCCESS,
            detail: "Emails loaded successfully.",
            data: res.rows
        });
    });
};

exports.send_email = function(req, response) {
    if (!req.session || !req.session.address) {
        return response.send({
            code: NOT_AUTH,
            detail: "User not authenticated.",
            data: null
        });
    }

    const { subject, to, content } = req.body;

    if (
        typeof subject !== "string" ||
        typeof to !== "string" ||
        typeof content !== "string" ||
        !subject.trim() ||
        !to.trim() ||
        !content.trim()
    ) {
        return response.send({
            code: INVALID_INPUT,
            detail: "Please fill in all email fields.",
            data: null
        });
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(to.trim())) {
        return response.send({
            code: INVALID_INPUT,
            detail: "Please enter a valid recipient email address.",
            data: null
        });
    }

    pool.query(
        "INSERT INTO sent_emails (sender, recipient, subject, content) VALUES ($1, $2, $3, $4)",
        [req.session.address, to.trim(), subject.trim(), content.trim()],
        (err) => {
            if (err) {
                return response.send({
                    code: UNEXPECTED,
                    detail: "Unable to save your email. Please try again.",
                    data: null
                });
            }

            pool.query(
                "INSERT INTO received_emails (sender, recipient, subject, content) VALUES ($1, $2, $3, $4)",
                [req.session.address, to.trim(), subject.trim(), content.trim()],
                (err2) => {
                    if (err2) {
                        return response.send({
                            code: UNEXPECTED,
                            detail: "Your email could not be delivered. Please try again.",
                            data: null
                        });
                    }

                    response.send({
                        code: SUCCESS,
                        detail: "Email stored successfully.",
                        data: null
                    });
                }
            );
        }
    );
};
