import React from 'react';
import './welcome.css';
import Axios from 'axios';
import { SUCCESS } from './error_codes';
import Speech2Text from "./s2t.js";
import Spell2Text from "./spell2text.js"
var synth = window.speechSynthesis //for text to speech
var allText = [] //Keeps the user sayings

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
        count:0,
        step:0
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

//This function converts the text to speech
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
    Axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
    address: this.state.email,
    password: this.state.password
}, { withCredentials: true })
    .then((req) => {
        console.log("Server response:", req.data);
        if (req.data.code === 200) {  // ✅ Ensure SUCCESS is correctly checked
            console.log("✅ Login successful, calling ask_auth()");
            this.text2speech("Login successful, pls hit the spacebar for instructions.");
            this.setState(
                { email: "", password: "" },  // ✅ Clears login fields after success
                () => this.props.ask_auth()  // ✅ Calls ask_auth AFTER state updates
            );
        } else {
            console.error("❌ Login failed:", req.data.detail);
            alert(req.data.detail);
            this.text2speech(req.data.detail);
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
    if (e) {
        e.preventDefault();
    }
    Axios.post(`${process.env.REACT_APP_API_URL}/api/auth/sign_in`, { 
    address: this.state.email_for_registration, 
    username: this.state.username, 
    password: this.state.password_for_registration 
}, { withCredentials: true })
    .then((req) => {
        if (req.data.code === SUCCESS) {
            alert("✅ Sign-up successful! You can now log in.");
            this.text2speech("Sign-up successful! You can now log in.");
            this.setState({
                email_for_registration: "",
                username: "",
                password_for_registration: ""
            });
        } else {
            alert("❌ Sign-up failed: " + req.data.detail);
            this.text2speech(req.data.detail);
        }
    })
    .catch((error) => {
        console.error("Sign-up error:", error);
        alert("❌ Sign-up failed. Please try again later.");
    });
}

//When user is pressed the space key, voice assistant starts to inform user about options
handleClick(e) {
    //e.preventDefault();
    if (e.keyCode === 32) {
        this.text2speech(`To create a new account, please say "New account".
        To enter to your existing account, please say "log in".Then Say "Submit" for operation.
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
  if (err || !text || text.trim() === "") {
      this.setState({ listening: false });
      return;
  }
  setTimeout(() => {
      text = text.toLowerCase().trim()
          .replace(/\s+/g, " ")
          .replace(/at the rate/g, "@")
          .replace(/period/g, ".");
      console.log("Processed Input:", text);

      if (this.state.step !== 0 && (text === "new account" || text === "login")) {
          console.log("Ignoring repeated new account/login command since step is not 0");
          return;
      }
      // Check if the user said "submit" before processing other steps
    if (text === "submit") {
        if (this.state.step === 5 || this.state.step === 6) {
            console.log("Submit detected, processing login or signup...");
        if (this.state.email_for_registration) {
            this.handleSignSubmit(null);
        } else {
            this.handleLoginSubmit(null);
        }
    } else {
        this.text2speech("Submit command is not expected at this moment. Please continue your input.");
    }
    return;
    }
      if (text === "restart") {
          this.setState({
              step: 0,
              email_for_registration: "",
              username: "",
              password_for_registration: "",
              email: "",
              password: ""
          });
          this.text2speech("Restarting. Please say 'New account' or 'Login' to start.");
          return;
      }
      if (this.state.step === 0) {
          if (text === "new account") {
              this.setState({ step: 1 });
              this.text2speech("Please say your email address. You can say 'at the rate' for '@' and 'period' for '.'");
          } 
          else if (text === "login") {
              console.log("Login flow started.");
              this.setState({ step: 4 });
              this.text2speech("Please say your email address for login. You can say 'at the rate' for '@' and 'period' for '.'");
          }
      } 
      else if (this.state.step === 1) {
          console.log("Captured email for registration:", text);
          this.setState({ 
              email_for_registration: text.replace(/\s+/g, ""),
              step: 2 
          }, () => {
              this.text2speech("Got it. Now, say your username.");
          });
      } 
      else if (this.state.step === 2) {
          console.log("Captured username:", text);
          this.setState({ 
              username: text.replace(/\s+/g, ""),
              step: 3 
          }, () => {
              this.text2speech("Now, say your password.");
          });
      } 
      else if (this.state.step === 3) {
          console.log("Captured password for registration.");
          this.setState({ 
              password_for_registration: text.replace(/\s+/g, ""),
              step: 5 
          }, () => {
              this.text2speech(`You said, Email: ${this.state.email_for_registration}, Username: ${this.state.username}, Password: ${this.state.password_for_registration}. 
              If correct, say 'Submit'. Otherwise, say 'Restart'.`);
          });
      }
      else if (this.state.step === 4) {
          console.log("Captured login email:", text);
          this.setState({ 
              email: text.replace(/\s+/g, ""),
              step: 5 
          }, () => {
              this.text2speech("Got it. Now, say your password.");
          });
      } 
      else if (this.state.step === 5) {
          console.log("Captured login password:", text);
          this.setState({ 
              password: text.replace(/\s+/g, ""),
              step: 6 
          }, () => {
              this.text2speech(
                  `You said, Email: ${this.state.email}, Password: ${this.state.password}. If this is correct, say 'Submit'. Otherwise, say 'Restart'.`
              );
          });
      } 
      else if (text === "submit") {
          console.log("Submit detected, processing login or signup...");
          if (this.state.email_for_registration) {
              this.handleSignSubmit(null);
          } else {
              this.handleLoginSubmit(null);
          }
      }
  }, 100);
}

//Voice assistant welcomes the user in the initial load
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

                            type="email"

                            placeholder="Email"

                            name="email"

                            value={this.state.email}

                            onChange={this.handleChange}

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

                                value={this.state.password_for_registration}

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

