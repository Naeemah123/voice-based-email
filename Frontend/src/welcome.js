import React from 'react';
import './welcome.css';
import Axios from 'axios';
import { SUCCESS } from './error_codes';
import Speech2Text from "./s2t.js";
import Spell2Text from "./spell2text.js"



var synth = window.speechSynthesis  //for text to speech
var allText = []        //Keeps the user sayings
class Welcome extends React.Component {
    constructor() {
        super();
        this.state = {
            email: "",
            emailError: "",
            password: "",
            username: "",
            email_for_registration: "",
            password_for_registration: "",
            initial: true,
            text: "",
            listening: false,
            count:0
        }

        //Methods have to be binded to be able to use
        this.handleChange = this.handleChange.bind(this);
        this.handleLoginSubmit = this.handleLoginSubmit.bind(this);
        this.handleSignSubmit = this.handleSignSubmit.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleEnd = this.handleEnd.bind(this);
        this.handleStart = this.handleStart.bind(this);
    }

    //Input values are kept in the local states
    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }
    /*validateEmail() {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(this.state.email_for_registration)) {
            this.setState({ emailError: "Invalid email format" });
        } else {
            this.setState({ emailError: "" });
        }
    }*/
        validateEmail = () => {
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
            this.setState((prevState) => {
                const newEmailError = !emailPattern.test(prevState.email_for_registration)
                    ? "Invalid email format"
                    : "";
        
                console.log("Updating Email Error:", newEmailError);  // ✅ Debugging
                return { emailError: newEmailError };
            });
        };
        
        
    /*validateEmail = () => {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(this.state.email_for_registration)) {
                this.setState({ emailError: "Invalid email format" });
        } else {
                this.setState({ emailError: "" });
            }
        };*/

    //This function converts the text to speech
    /*text2speech(text) {
        synth.cancel()
        var utterThis = new SpeechSynthesisUtterance(text);
        synth.speak(utterThis);
    }*/
        text2speech(text) {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();  // Stop any ongoing speech
            }
        
            setTimeout(() => {
                var utterThis = new SpeechSynthesisUtterance(text);
                window.speechSynthesis.speak(utterThis);
            }, 500);  // Delay to ensure smooth playback
        }
        

    //When login button is pressed, this method is called. It sends the login info to backend
    handleLoginSubmit(e) {
        if (e) {
            e.preventDefault();
        }
    
        console.log("Submitting login request with:", {
            address: this.state.email,
            password: this.state.password
        });
    
        Axios.post("/auth/login", {
            address: this.state.email,
            password: this.state.password
        })
        .then((req) => {
            console.log("Server response:", req.data);  // ✅ Debugging
    
            if (req.data.code === SUCCESS) {
                this.props.ask_auth();
            } else {
                alert(req.data.detail);
                this.text2speech(req.data.detail);
                
                // ✅ Debugging: Check if setState is resetting values correctly
                console.log("Resetting state...");
                
                this.setState({
                    email: "",
                    password: "",
                    email_for_registration: "",
                    username: "",
                    password_for_registration: ""
                });
    
                allText = [];
            }
        })
        .catch((error) => {
            console.error("Login request failed:", error);
            alert("An error occurred while logging in.");
        });
    }
    

    //When sign up button is pressed, this method is called. It sends the sign up info to backend
    handleSignSubmit(e) {
        if (e){
            e.preventDefault();
        }
        Axios.post("api/auth/sign_in", {"address": this.state.email_for_registration,"username": this.state.username ,"password": this.state.password_for_registration}).then((req) => {
            if (req.data.code === SUCCESS) {
                this.props.ask_auth()
            } else {
                alert(req.data.detail)
                this.text2speech(req.data.detail)

                //States will be emptied
                this.setState({
                    email: "",
                    password: "",
                    email_for_registration: "",
                    username: "",
                    password_for_registration: ""



                })
                allText = []
            }
        })
    }

    //When user is pressed the space key, voice assistant starts to inform user about options
    handleClick(e) {
        //e.preventDefault();
        if (e.keyCode === 32) {
            this.text2speech(`To create a new account, please say "New account" and say your gmail address, username, and password respectively. OR
            To enter to your existing account, please say "log in", and say your gmail address and password. Then Say "Submit" for operation.
            Use the "Escape key", to start, and end your speech. You can say "restart" to start over.`)
        }
    }

    //when the page is loaded
    componentDidMount() {
        document.addEventListener('keypress', this.handleClick)    
    }

    componentWillUnmount() {
        synth.cancel()
        document.removeEventListener('keypress', this.handleClick)
    }

    //This function starts the speech to text process
    handleStart() {
        this.setState({
            listening: true
        })
        synth.cancel()
    }

    //This function ends the speech to text process and speech will be saved
    handleEnd(err, text) {

        console.log("Speech recognition result:", text);
        if (err) {
            console.log("Speech recognition error:", err);
            this.setState({ listening: false });
            return;
        }
    
        if (!text || text.trim() === "") {  // ✅ Handles both null and empty text
            console.log("No speech detected or empty input.");
            this.setState({ listening: false });
            return;
        }
    
        if (text.toLowerCase().replace(/ /g, "") === "restart") {
            allText = [];
            this.setState({ listening: false });
            return;
        }
    
        this.setState({ text: text, listening: false });  // ✅ Combined state update

        //All speeches are kept into this array
        allText.push(text)
        console.log(allText)

        //When user says the submit
        if (allText[allText.length - 1].toLowerCase() === "submit") {

            //Since @ is understands like "at", it converts to correct gmail form
            //allText[1] = allText[1].slice(0, allText[1].indexOf("atgmail.com")) + "@gmail.com"

            allText[1] = "testmailappleandbanana@gmail.com"  //Email is given direct to test our code

            //When user says login, related states will be assigned and login function is called
            if (allText[0].toLowerCase().replace(/\s/g, "") === "login") {
                console.log(allText[2].toLowerCase().replace(/\s/g, ""))
                this.setState({
                    email: allText[1].toLowerCase().replace(/\s/g, ""),
                    password: allText[2].toLowerCase().replace(/\s/g, ""),

                })
                this.handleLoginSubmit(null);
            }
            //When user says new account, related states will be assigned and sign up function is called
            else if (allText[0].toLowerCase().replace(/\s/g, "") === "newaccount"){
                this.setState({
                    email_for_registration: allText[1].toLowerCase().replace(/\s/g, ""),
                    username: allText[2].toLowerCase(),
                    password_for_registration: allText[3].toLowerCase().replace(/\s/g, ""),

                })
                this.handleSignSubmit(null);
            }

        }
    }
    
    //Voice assistant welcomes the user in the initial load
    /*componentDidMount() {
        this.setState({ initial: false }, () => {
            this.text2speech("Welcome To The Voice Based Email System. Please hit the spacebar to listen to the voice assistant");
        },500);
    }*/
    componentDidMount() {
        this.setState({ initial: false }, () => {
            setTimeout(() => {
                this.text2speech("Welcome To The Voice Based Email System. Please hit the spacebar to listen to the voice assistant");
            }, 500);
        });
        //Ensure spacebar listener is always attached
        document.addEventListener("keydown", this.handleClick);
    }
    
    render() {
       
        return (

            <div className="page">  
                    
                <div className="logo"></div>
                <div className="header">
                    <h2>Welcome To The Voice Based Email System</h2>
                </div>

                <div className="content">
                    <div className="col-sm-8 main-section">

                        
                        <Speech2Text  onStart={this.handleStart} onEnd={this.handleEnd} />
                        <Spell2Text onStart={this.handleStart} onEnd={this.handleEnd} />
                   

                        <form onSubmit={this.handleLoginSubmit}>
                            Email
                            <div className="form-group">
                                <input
                                    className="form-input"
                                    type="email" placeholder="Email"
                                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,14}$"
                                    name="email"
                                    onChange={this.handleChange}
                                    value={this.state.email}
                                    required
                                />
                            </div>
                            Password
                            <div className="form-group">
                                <input
                                    className="form-input"
                                    type="password"
                                    placeholder="Password"
                                    onChange={this.handleChange}
                                    value={this.state.password}
                                    name="password"
                                    required
                                />
                            </div>
                            <br />

                            <div className="form-group">
                                <div className="btn-group btn-group-block">
                                    <button className="btn btn-primary btn-block" type="submit" value="Submit">Login</button>
                                </div>
                            </div>
                        </form>

                        <br />
                        <div className="divider text-center" data-content="OR SIGN UP"></div>
                        <form onSubmit={this.handleSignSubmit}>
                            Email
                            <div className="form-group">
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="Email"
                                    name="email_for_registration"
                                    value={this.state.email_for_registration}
                                    onChange={this.handleChange}
                                    onBlur={this.validateEmail}  // ✅ Validate email when user finishes typing
                                    required
                                />
                                <span style={{ color: "red", fontSize: "14px" }}>
                                    {this.state.emailError}
                                </span>  {/* ✅ Show error message */}
                            </div>

                            Username
                            <div className="form-group">
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Username"
                                    onChange={this.handleChange}
                                    value={this.state.username}
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
                                    onInput={this.handleChange}
                                    value={this.state.registrationpassword}
                                    name="password_for_registration"
                                    required
                                />
                            </div>

                            <br />
                            <div className="form-group">
                                <div className="btn-group btn-group-block">
                                    <button className="btn btn-primary btn-block" type="submit">Sign Up</button>
                                </div>
                            </div>
                        </form>
                    </div>

                </div>

            </div>
        )
    }
}

export default Welcome;