import React, { useState, useEffect, useRef } from 'react';
import './welcome.css';
import axios from 'axios';
import { SUCCESS } from '../../utils/error_codes.js';
import Speech2Text from "../../components/speech2text/s2t.js";
import Spell2Text from "../../components/spell2text/spell2text.js";

var synth = window.speechSynthesis;

function Welcome(props) {
    const [state, setState] = useState({
        email: "",
        emailError: "",
        password: "",
        username: "",
        email_for_registration: "",
        password_for_registration: "",
        initial: true,
        text: "",
        listening: false,
        count: 0,
        step: 0
    });

    const stateRef = useRef(state);

    const updateState = (updates, callback) => {
        const newState = { ...stateRef.current, ...updates };
        stateRef.current = newState;
        setState(newState);

        if (callback) {
            callback();
        }
    };

    const text2speech = (text) => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        setTimeout(() => {
            var utterThis = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterThis);
        }, 500);
    };

    const handleChange = (e) => {
        updateState({
            [e.target.name]: e.target.value
        });
    };

    const validateEmail = () => {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        updateState({
            emailError: !emailPattern.test(stateRef.current.email_for_registration)
                ? "Invalid email format"
                : ""
        });
    };

    const handleLoginSubmit = (e) => {
        if (e) {
            e.preventDefault();
        }

        const currentState = stateRef.current;

        if (!currentState.email.trim() || !currentState.password.trim()) {
            alert("Please enter your email and password.");
            text2speech("Please enter your email and password.");
            return;
        }

        axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
            address: currentState.email,
            password: currentState.password
        }, { withCredentials: true })
            .then((req) => {
                if (req.data.code === SUCCESS) {
                    text2speech("Login successful. Please hit the spacebar for instructions.");

                    updateState({
                        email: "",
                        password: ""
                    }, () => props.ask_auth());
                } else {
                    alert("Login failed. Please check your email and password.");
                    text2speech("Login failed. Please check your email and password.");

                    updateState({
                        email: "",
                        password: ""
                    });
                }
            })
            .catch(() => {
                alert("Unable to log in. Please try again.");
                text2speech("Unable to log in. Please check your connection and try again.");
            });
    };

    const handleSignSubmit = (e) => {
        if (e) {
            e.preventDefault();
        }

        const currentState = stateRef.current;
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (
            !currentState.email_for_registration.trim() ||
            !currentState.username.trim() ||
            !currentState.password_for_registration.trim()
        ) {
            alert("Please fill in all registration fields.");
            text2speech("Please fill in all registration fields.");
            return;
        }

        if (!emailPattern.test(currentState.email_for_registration)) {
            updateState({ emailError: "Invalid email format" });
            alert("Please enter a valid email address.");
            text2speech("Please enter a valid email address.");
            return;
        }

        axios.post(`${process.env.REACT_APP_API_URL}/api/auth/sign_in`, {
            address: currentState.email_for_registration,
            username: currentState.username,
            password: currentState.password_for_registration
        }, { withCredentials: true })
            .then((req) => {
                if (req.data.code === SUCCESS) {
                    alert("Sign-up successful! You can now log in.");
                    text2speech("Sign-up successful! You can now log in.");

                    updateState({
                        email_for_registration: "",
                        username: "",
                        password_for_registration: "",
                        emailError: ""
                    });
                } else {
                    const message = req.data.detail || "Sign-up failed. Please try again.";

                    alert(message);
                    text2speech(message);
                }
            })
            .catch(() => {
                alert("Unable to sign up. Please try again.");
                text2speech("Unable to sign up. Please check your connection and try again.");
            });
    };

    const handleClick = (e) => {
        if (e.keyCode === 32) {
            text2speech(`To create a new account, please say "New account".
To enter to your existing account, please say "log in". Then say "Submit" for operation.
Use the "Escape key", to start, and end your speech. You can say "restart" to start over.`);
        }
    };

    const handleStart = () => {
        updateState({ listening: true });
        synth.cancel();
    };

    const handleEnd = (err, text) => {
        if (err || !text || text.trim() === "") {
            updateState({ listening: false });
            return;
        }

        setTimeout(() => {
            text = text.toLowerCase().trim()
                .replace(/\s+/g, " ")
                .replace(/at the rate/g, "@")
                .replace(/period/g, ".");

            let currentState = stateRef.current;

            if (currentState.step !== 0 && (text === "new account" || text === "login")) {
                return;
            }

            if (text === "submit") {
                if (currentState.step === 5 || currentState.step === 6) {
                    if (currentState.email_for_registration) {
                        handleSignSubmit(null);
                    } else {
                        handleLoginSubmit(null);
                    }
                } else {
                    text2speech("Submit command is not expected at this moment. Please continue your input.");
                }

                return;
            }

            if (text === "restart") {
                updateState({
                    step: 0,
                    email_for_registration: "",
                    username: "",
                    password_for_registration: "",
                    email: "",
                    password: "",
                    emailError: ""
                });

                text2speech("Restarting. Please say 'New account' or 'Login' to start.");
                return;
            }

            if (currentState.step === 0) {
                if (text === "new account") {
                    updateState({ step: 1 });
                    text2speech("Please say your email address. You can say 'at the rate' for '@' and 'period' for '.'");
                } else if (text === "login") {
                    updateState({ step: 4 });
                    text2speech("Please say your email address for login. You can say 'at the rate' for '@' and 'period' for '.'");
                } else {
                    text2speech("Wrong option. Please say New account or Login.");
                }
            } else if (currentState.step === 1) {
                updateState({
                    email_for_registration: text.replace(/\s+/g, ""),
                    step: 2
                }, () => {
                    text2speech("Got it. Now, say your username.");
                });
            } else if (currentState.step === 2) {
                updateState({
                    username: text.replace(/\s+/g, ""),
                    step: 3
                }, () => {
                    text2speech("Now, say your password.");
                });
            } else if (currentState.step === 3) {
                const password = text.replace(/\s+/g, "");

                updateState({
                    password_for_registration: password,
                    step: 5
                }, () => {
                    const updatedState = stateRef.current;

                    text2speech(`You said, Email: ${updatedState.email_for_registration}, Username: ${updatedState.username}. If correct, say 'Submit'. Otherwise, say 'Restart'.`);
                });
            } else if (currentState.step === 4) {
                updateState({
                    email: text.replace(/\s+/g, ""),
                    step: 5
                }, () => {
                    text2speech("Got it. Now, say your password.");
                });
            } else if (currentState.step === 5) {
                const password = text.replace(/\s+/g, "");

                updateState({
                    password: password,
                    step: 6
                }, () => {
                    text2speech("Password received. If this is correct, say 'Submit'. Otherwise, say 'Restart'.");
                });
            }
        }, 100);
    };

    useEffect(() => {
        const welcomeTimer = setTimeout(() => {
            text2speech("Welcome To The Voice Based Email System. Please hit the spacebar to listen to the voice assistant");
        }, 500);

        updateState({ initial: false });

        document.addEventListener('keypress', handleClick);
        document.addEventListener('keydown', handleClick);

        return () => {
            clearTimeout(welcomeTimer);
            synth.cancel();
            document.removeEventListener('keypress', handleClick);
            document.removeEventListener('keydown', handleClick);
        };
    }, []);

    return (
        <div className="page">
            <div className="logo"></div>

            <div className="header">
                <h2>Welcome To The Voice Based Email System</h2>
            </div>

            <div className="content">
                <div className="col-sm-8 main-section">
                    <Speech2Text onStart={handleStart} onEnd={handleEnd} />
                    <Spell2Text onStart={handleStart} onEnd={handleEnd} />

                    <form onSubmit={handleLoginSubmit}>
                        Email

                        <div className="form-group">
                            <input
                                className="form-input"
                                type="email"
                                placeholder="Email"
                                name="email"
                                value={state.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        Password

                        <div className="form-group">
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Password"
                                onChange={handleChange}
                                value={state.password}
                                name="password"
                                required
                            />
                        </div>

                        <br />

                        <div className="form-group">
                            <div className="btn-group btn-group-block">
                                <button className="btn btn-primary btn-block" type="submit" value="Submit">
                                    Login
                                </button>
                            </div>
                        </div>
                    </form>

                    <br />

                    <div className="divider text-center" data-content="OR SIGN UP"></div>

                    <form onSubmit={handleSignSubmit}>
                        Email

                        <div className="form-group">
                            <input
                                className="form-input"
                                type="email"
                                placeholder="Email"
                                name="email_for_registration"
                                value={state.email_for_registration}
                                onChange={handleChange}
                                onBlur={validateEmail}
                                required
                            />

                            <span style={{ color: "red", fontSize: "14px" }}>
                                {state.emailError}
                            </span>
                        </div>

                        Username

                        <div className="form-group">
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Username"
                                onChange={handleChange}
                                value={state.username}
                                name="username"
                                required
                            />
                        </div>

                        Password

                        <div className="form-group">
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Password"
                                onInput={handleChange}
                                value={state.password_for_registration}
                                name="password_for_registration"
                                required
                            />
                        </div>

                        <br />

                        <div className="form-group">
                            <div className="btn-group btn-group-block">
                                <button className="btn btn-primary btn-block" type="submit">
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Welcome;