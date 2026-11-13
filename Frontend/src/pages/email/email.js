import React, { useState, useEffect } from 'react';
import './email.css';
import axios from 'axios';
import { SUCCESS } from '../../utils/error_codes.js';
import Speech2Text from "../../components/speech2text/s2t.js";
import Spell2Text from "../../components/spell2text/spell2text.js";

var synth = window.speechSynthesis;

function Email(props) {
    const [state, setState] = useState({
        InboxMails: [],
        SentMails: [],
        mailsContent: (
            <tr>
                <td colSpan="2" id="noselected_div">
                    No Folder selected.
                </td>
            </tr>
        ),
        mailBody: (
            <div className="noselected_div">
                No Mail selected.
            </div>
        ),
        mail_list_header1: "",
        mail_list_header2: "",
        email_to_send: "",
        subject_to_send: "",
        message_to_send: "",
        utterText: " To Send Email, please say Send Email. To Listen Email, say Listen. and To Exit, say Logout",
        initial: true,
        sendEmail: false,
        inboxEmail: false,
        sentEmail: false
    });

    const updateState = (updates) => {
        setState(prev => ({
            ...prev,
            ...updates
        }));
    };

    const text2speech = (text) => {
        synth.cancel();
        var utterThis = new SpeechSynthesisUtterance(text);
        synth.speak(utterThis);
    };

    const get_emails = () => {
        axios.post(
            `${process.env.REACT_APP_API_URL}/api/email/fetch_emails`,
            { search: "INBOX" },
            { withCredentials: true }
        )
        .then((req) => {
            if (req.data.code === SUCCESS) {
                updateState({
                    InboxMails: req.data.data
                });
            } else {
                updateState({ InboxMails: [] });
                text2speech("Unable to load your inbox. Please try again.");
            }
        })
        .catch(() => {
            updateState({ InboxMails: [] });
            text2speech("Unable to load your inbox. Please check your connection and try again.");
        });
    };

    const get_emails_sent = () => {
        axios.post(
            `${process.env.REACT_APP_API_URL}/api/email/fetch_emails`,
            { search: "SENT" },
            { withCredentials: true }
        )
        .then((req) => {
            if (req.data.code === SUCCESS) {
                updateState({
                    SentMails: req.data.data
                });
            } else {
                updateState({ SentMails: [] });
                text2speech("Unable to load your sent emails. Please try again.");
            }
        })
        .catch(() => {
            updateState({ SentMails: [] });
            text2speech("Unable to load your sent emails. Please check your connection and try again.");
        });
    };

    const inboxFunction = () => {
        const list = state.InboxMails.map((item, index) =>
            <tr key={index} onClick={() => mailContent(item, 0)}>
                <td>{item.target}</td>
                <td>{item.subject}</td>
            </tr>
        );

        updateState({
            mailsContent: list,
            mail_list_header1: "From",
            mail_list_header2: "Subject",
            readingInboxIndex: true
        });

        if (state.InboxMails.length > 0) {
            const firstEmail = state.InboxMails[0];

            const speechText = `Inbox emails loaded. You have ${state.InboxMails.length} emails. The index starts with 00 for the first email, 01 for the second, and so on. Please say the index number of the email you want me to read. For example, say 00 for the first email which is from ${firstEmail.target} with subject ${firstEmail.subject}.`;

            text2speech(speechText);
        } else {
            text2speech("Inbox emails loaded but your inbox is empty.");
            updateState({ readingInboxIndex: false });
        }
    };

    const sentFunction = () => {
        const list = state.SentMails.map((item, index) =>
            <tr key={index} onClick={() => mailContent(item, 1)}>
                <td>{item.target}</td>
                <td>{item.subject}</td>
            </tr>
        );

        updateState({
            mailsContent: list,
            mail_list_header1: "To",
            mail_list_header2: "Subject",
            readingSentIndex: true
        });

        if (state.SentMails.length > 0) {
            const firstEmail = state.SentMails[0];

            const speechText = `Sent emails loaded. You have ${state.SentMails.length} emails. The index starts with 00 for the first email, 01 for the second, and so on. Please say the index number of the email you want me to read. For example, say 00 for the first email which is to ${firstEmail.target} with subject ${firstEmail.subject}.`;

            text2speech(speechText);
        } else {
            text2speech("Sent emails loaded but you have no sent emails.");
            updateState({ readingSentIndex: false });
        }
    };

    const mailContent = (item, id) => {
        var from_to = "From:";
        var address = item.target;

        if (id === 1) {
            from_to = "To:";
            address = item.target;
        }

        const content = (
            <div className="mailbody_div">
                <table>
                    <tbody>
                        <tr>
                            <td><h5>{from_to} </h5></td>
                            <td><h6>{address}</h6></td>
                        </tr>
                        <tr>
                            <td><h5>Subject: </h5></td>
                            <td><h6>{item.subject}</h6></td>
                        </tr>
                    </tbody>
                </table>

                <hr size="10" />

                <p>{item.content}</p>
            </div>
        );

        updateState({
            mailBody: content
        });
    };

    const sendMail = () => {
        updateState({ sendEmail: true, step: 0 });
    };

    const handleLogout = (e) => {
        if (e) {
            e.preventDefault();
        }

        axios.get(
            `${process.env.REACT_APP_API_URL}/api/auth/logout`,
            { withCredentials: true }
        )
        .then(() => {
            text2speech("Logout successful.");
            props.ask_auth();
        })
        .catch(() => {
            text2speech("Logout failed. Please try again.");
            alert("Unable to log out. Please try again.");
        });
    };

    const handleChange = (e) => {
        updateState({
            [e.target.name]: e.target.value
        });
    };

    const handleSendSubmit = (e) => {
        if (e) {
            e.preventDefault();
        }

        if (
            !state.email_to_send.trim() ||
            !state.subject_to_send.trim() ||
            !state.message_to_send.trim()
        ) {
            alert("Please fill in all email fields.");
            text2speech("Please fill in the recipient, subject and message.");
            return;
        }

        axios.post(
            `${process.env.REACT_APP_API_URL}/api/email/send_email`,
            {
                subject: state.subject_to_send,
                to: state.email_to_send,
                content: state.message_to_send
            },
            { withCredentials: true }
        )
        .then((req) => {
            if (req.data.code === SUCCESS) {
                alert("Email sent successfully!");
                text2speech("Email sent successfully. To send email, say Send Email. To listen to email, say Listen. And to exit, say Logout.");

                updateState({
                    email_to_send: "",
                    message_to_send: "",
                    subject_to_send: ""
                });
            } else {
                alert("Unable to send email. Please check the details and try again.");
                text2speech("Unable to send email. Please check the details and try again.");
            }
        })
        .catch(() => {
            alert("Unable to send email. Please check your connection and try again.");
            text2speech("Unable to send email. Please check your connection and try again.");
        });
    };

    const handleClick = (e) => {
        if (e.keyCode === 32) {
            text2speech(state.utterText);
        }
    };

    const handleStart = () => {
        updateState({
            listening: true
        });

        synth.cancel();
    };

    const handleEnd = (err, text) => {
        if (err || !text || text.trim() === "") {
            updateState({ listening: false });
            return;
        }

        if (state.readingInboxIndex && /^\d+$/.test(text)) {
            const index = parseInt(text, 10);

            if (index >= 0 && index < state.InboxMails.length) {
                updateState({ readingInboxIndex: false });

                const selectedMail = state.InboxMails[index];

                mailContent(selectedMail, 0);

                const speechText = `Reading email from ${selectedMail.target}, subject ${selectedMail.subject}. ${selectedMail.content}`;

                text2speech(speechText);
                return;
            } else {
                text2speech(`Index ${text} is out of range. Please try again.`);
                return;
            }
        }

        if (state.readingSentIndex && /^\d+$/.test(text)) {
            const index = parseInt(text, 10);

            if (index >= 0 && index < state.SentMails.length) {
                updateState({ readingSentIndex: false });

                const selectedMail = state.SentMails[index];

                mailContent(selectedMail, 1);

                const speechText = `Reading sent email number ${String(index).padStart(2, '0')}. To: ${selectedMail.target}, Subject: ${selectedMail.subject}. ${selectedMail.content}`;

                text2speech(speechText);
                return;
            } else {
                text2speech(`Index ${text} is out of range. Please try again.`);
                return;
            }
        }

        text = text.toLowerCase().trim()
            .replace(/\s+/g, " ")
            .replace(/at the rate/g, "@")
            .replace(/period/g, ".");

        if (text === "restart") {
            window.speechSynthesis.cancel();

            updateState({
                step: 0,
                email_to_send: "",
                subject_to_send: "",
                message_to_send: ""
            });

            text2speech("Restarting. Please say the recipient's email.");
            return;
        }

        if (state.sendEmail === true) {
            if (state.step === 0) {
                updateState({
                    email_to_send: text.replace(/\s+/g, ""),
                    step: 1
                });

                text2speech("Got it. Now, say the subject.");
            } else if (state.step === 1) {
                updateState({
                    subject_to_send: text,
                    step: 2,
                    processingSpeech: false
                });

                text2speech("Got it. Now, say the message.");
            } else if (state.step === 2) {
                updateState({
                    message_to_send: text,
                    step: 3
                });

                text2speech(`You said, Email: ${state.email_to_send}, Subject: ${state.subject_to_send}, Message: ${text}. If correct, say 'Submit'. Otherwise, say 'Restart'.`);
            } else if (text === "submit") {
                handleSendSubmit(null);
            }
        } else {
            if (text === "send email" || text === "send message") {
                text2speech("Please say the recipient's email. You can say 'at the rate' for '@' and 'period' for '.'");

                updateState({
                    step: 0,
                    sendEmail: true,
                    inboxEmail: false,
                    sentEmail: false
                });

                sendMail();
            } else if (text === "listen") {
                text2speech("To listen to Inbox emails, say 'Inbox'. To listen to Sent emails, say 'Sent'. You can say 'Restart' to start over.");
            } else if (text === "inbox") {
                inboxFunction();
                text2speech("Inbox emails loaded.");
            } else if (text === "sent" || text === "send") {
                sentFunction();
                text2speech("Sent emails loaded.");
            } else if (text === "logout") {
                handleLogout(null);
            } else {
                text2speech("Wrong option, please say again.");
            }
        }
    };

    useEffect(() => {
        get_emails();
        get_emails_sent();

        document.addEventListener('keypress', handleClick);

        return () => {
            synth.cancel();
            document.removeEventListener('keypress', handleClick);
        };
    }, []);

    useEffect(() => {
        if (state.initial === true) {
            updateState({ initial: false });

            text2speech("Login successful");
            text2speech("To Listen to menu, please hit the spacebar");
        }
    }, []);

    return (
        <div className="flex-centered">
            <Speech2Text onStart={handleStart} onEnd={handleEnd} />
            <Spell2Text onStart={handleStart} onEnd={handleEnd} />

            <div className="app_div">
                <div className="header_section">
                    <p className="header_title">A Voice Based Email System</p>
                </div>

                <div className="menu_div">
                    <ul className="menu">
                        <li className="menu-item">
                            <div className="tile tile-centered">
                                <div className="tile-content">Menu</div>
                            </div>
                        </li>

                        <li className="divider"></li>

                        <li className="menu-item" onClick={sendMail}>
                            <a href="#top">Send Email</a>
                        </li>

                        <li className="menu-item">
                            <a href="#top">Listen Email</a>
                        </li>

                        <li className="menu-item">
                            <a href="#top" onClick={handleLogout}>Logout</a>
                        </li>
                    </ul>

                    <div className="mailbox_div">
                        <h4>Folders</h4>

                        <ul className="mailboxitem_div">
                            <li className="item_div" key={0}>
                                <button
                                    className="btn badge"
                                    data-badge={state.InboxMails.length}
                                    onClick={inboxFunction}
                                >
                                    Inbox
                                </button>
                            </li>

                            <li className="item_div" key={1}>
                                <button
                                    className="btn badge"
                                    data-badge={state.SentMails.length}
                                    onClick={sentFunction}
                                >
                                    Sent
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mails_div">
                    <table className="email-list table table-striped table-condensed">
                        <thead>
                            <tr>
                                <th width="70%">{state.mail_list_header1}</th>
                                <th width="30%">{state.mail_list_header2}</th>
                            </tr>
                        </thead>

                        <tbody>
                            {state.mailsContent}
                        </tbody>
                    </table>
                </div>

                <div className="mailcontent_div">
                    {state.sendEmail ? (
                        <form
                            className="form-horizontal"
                            action="#forms"
                            onSubmit={handleSendSubmit}
                        >
                            <div className="form-group">
                                <div className="col-3 col-sm-12">
                                    <label className="form-label" htmlFor="address">
                                        <h5>To: </h5>
                                    </label>
                                </div>

                                <div className="col-9 col-sm-12">
                                    <input
                                        className="form-input"
                                        id="address"
                                        type="email"
                                        placeholder="Email"
                                        name="email_to_send"
                                        value={state.email_to_send}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="col-3 col-sm-12">
                                    <label className="form-label" htmlFor="subject">
                                        <h5>Subject: </h5>
                                    </label>
                                </div>

                                <div className="col-9 col-sm-12">
                                    <input
                                        className="form-input"
                                        id="subject"
                                        type="text"
                                        placeholder="Subject"
                                        name="subject_to_send"
                                        value={state.subject_to_send}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="col-3 col-sm-12">
                                    <label className="form-label" htmlFor="message">
                                        <h5>Message: </h5>
                                    </label>
                                </div>

                                <div className="col-9 col-sm-12">
                                    <textarea
                                        className="form-input"
                                        id="message"
                                        placeholder="Textarea"
                                        rows="3"
                                        name="message_to_send"
                                        value={state.message_to_send}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="btn-group btn-group-block">
                                    <button
                                        className="btn btn-lg"
                                        id="sendemail_button"
                                        type="submit"
                                    >
                                        Send Email
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        state.mailBody
                    )}
                </div>
            </div>
        </div>
    );
}

export default Email;