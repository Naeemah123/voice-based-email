const {SUCCESS, NOT_AUTH, UNEXPECTED} = require("./error_codes.js");
const { pool } = require("./db.js");

// Fetch emails from database
exports.fetch_emails = function(req, response) {
    if (req.session.address) {
        const search = req.body["search"];
        
        if (search === "SENT") {
            console.log("📨 Fetching Sent Emails for:", req.session.address);  // ✅ Debugging

            pool.query("SELECT recipient AS target, subject, content FROM sent_emails WHERE sender = $1",
                [req.session.address], (err, res) => {
                    if (err) {
                        console.error("❌ Database Fetch Error:", err);
                        response.send({
                            code: UNEXPECTED,
                            detail: err.detail,
                            data: null
                        });
                    } else {
                        console.log("✅ Fetched Sent Emails:", res.rows);  // ✅ Debugging
                        response.send({
                            code: SUCCESS,
                            detail: "Success",
                            data: res.rows
                        });
                    }
                }
            );
        } else if (search === "INBOX") {
            console.log("📥 Fetching Inbox Emails for:", req.session.address);  // ✅ Debugging

            pool.query("SELECT sender AS target, subject, content FROM received_emails WHERE recipient = $1",
                [req.session.address], (err, res) => {
                    if (err) {
                        console.error("❌ Database Fetch Error:", err);
                        response.send({
                            code: UNEXPECTED,
                            detail: err.detail,
                            data: null
                        });
                    } else {
                        console.log("✅ Fetched Inbox Emails:", res.rows);  // ✅ Debugging
                        response.send({
                            code: SUCCESS,
                            detail: "Success",
                            data: res.rows
                        });
                    }
                }
            );
        } else {
            console.log("❌ Invalid search type");  // ✅ Debugging
            response.send({
                code: UNEXPECTED,
                detail: "Invalid search type",
                data: null
            });
        }
    } else {
        console.log("❌ User not authenticated when fetching emails.");  // ✅ Debugging
        response.send({
            code: NOT_AUTH,
            detail: "User not authenticated",
            data: null
        });
    }
};

// Send email function
exports.send_email = function(req, response) {
    if (req.session.address) {
        const body = req.body;
        const subject = body["subject"];
        const to = body["to"];
        const content = body["content"];

        console.log("📩 Storing email in DB:", {  // ✅ Debugging
            sender: req.session.address,
            recipient: to,
            subject: subject,
            content: content
        });

        // Store email in "sent_emails"
        pool.query("INSERT INTO sent_emails (sender, recipient, subject, content) VALUES ($1, $2, $3, $4)",
            [req.session.address, to, subject, content], (err, res) => {
                if (err) {
                    console.error("❌ Database Insert Error (sent_emails):", err);
                    return response.send({
                        code: UNEXPECTED,
                        detail: err.detail,
                        data: null
                    });
                } 
                
                console.log("✅ Email stored in sent_emails");  // ✅ Debugging

                // ✅ Also store email in "received_emails"
                pool.query("INSERT INTO received_emails (sender, recipient, subject, content) VALUES ($1, $2, $3, $4)",
                    [req.session.address, to, subject, content], (err2, res2) => {
                        if (err2) {
                            console.error("❌ Database Insert Error (received_emails):", err2);
                            return response.send({
                                code: UNEXPECTED,
                                detail: err2.detail,
                                data: null
                            });
                        } 

                        console.log("✅ Email stored in received_emails");  // ✅ Debugging
                        response.send({
                            code: SUCCESS,
                            detail: "Email stored successfully",
                            data: null
                        });
                    }
                );
            }
        );
    } else {
        response.send({
            code: NOT_AUTH,
            detail: "User not authenticated",
            data: null
        });
    }
};
