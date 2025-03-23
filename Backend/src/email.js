// Step 1: Include required modules
var Imap = require('imap'),
inspect = require('util').inspect; 
const Gmail = require('gmail-send');
const simpleParser = require('mailparser').simpleParser;
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
        } 
        // ✅ Fetch emails from the database instead of IMAP
        else if (search === "INBOX") {
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
        } 
        // ✅ If no database, fallback to IMAP
        else {
            console.log("📥 Fetching Inbox Emails via IMAP for:", req.session.address);
            get_emails(new Imap({
                user: req.session.address,
                password: req.session.password, 
                host: 'imap.gmail.com', 
                port: 993,
                tlsOptions: { rejectUnauthorized: false },
                tls: true
            }), search, (emails) => {
                response.send({
                    code: SUCCESS,
                    detail: "Success",
                    data: emails
                });
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



// Local function used by send_email
function write_email(options, content, callback) {
    const send = Gmail(options);
    send({ text: content }, (error, result, fullResult) => {
        if (error) {
            callback(error, null);
        } else {
            callback(null, result);
        }
    });
}

// Local helper for fetch_emails functions
function get_emails(imap, search_str, callback) {
    var emails = [];

    function openBox(cb) {
        imap.getBoxes((err, boxes) => {
            console.log(boxes);
            if (search_str === "SENT") {
                var objs = boxes["[Gmail]"].children;
                for (let key of Object.keys(objs)) {
                    if (objs[key].attribs[1] === "\\Sent") {
                        console.log("[Gmail]/" + key.trim(), ":", objs[key].attribs[1]);
                        imap.openBox("[Gmail]/" + key.trim(), true, cb);
                    }
                }
            } else {
                imap.openBox("INBOX", true, cb);
            }
        });
    }

    imap.once('ready', function () {
        openBox(function (err, box) {
            if (err) throw err;

            imap.search(['ALL'], function (err, results) {
                if (err) throw err;

                var f = imap.fetch(results, { bodies: '' });
                f.on('message', function (msg, seqno) {
                    console.log('Message #%d', seqno);
                    var prefix = '(#' + seqno + ') ';

                    msg.on('body', function (stream, info) {
                        console.log(prefix + 'Body');
                        const chunks = [];
                        stream.on("data", function (chunk) {
                            chunks.push(chunk);
                        });

                        stream.on("end", function () {
                            simpleParser(Buffer.concat(chunks).toString(), (err, mail) => {
                                var target, subject, content;
                                if (search_str === "INBOX") {
                                    target = mail.from.text;
                                    subject = mail.subject;
                                    content = mail.text;
                                } else {
                                    target = mail.to.text;
                                    subject = mail.subject;
                                    content = mail.text;
                                }
                                emails.push({
                                    target: target,
                                    subject: subject,
                                    content: content
                                });
                            });
                        });
                    });

                    msg.once('attributes', function (attrs) {
                        console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
                    });

                    msg.once('end', function () {
                        console.log(prefix + 'Finished');
                    });
                });

                f.once('error', function (err) {
                    console.log('Fetch error: ' + err);
                });

                f.once('end', function () {
                    console.log('Done fetching all messages!');
                    imap.end();
                });
            });
        });
    });

    imap.once('error', function (err) {
        console.log(err);
    });

    imap.once('end', function () {
        console.log('Connection ended');
        callback(emails);
    });

    imap.connect();
}
