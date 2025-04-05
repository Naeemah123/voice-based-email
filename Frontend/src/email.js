// eslint-disable-no-redeclare
import React from 'react';
import './email.css';
import Axios from 'axios';
import { SUCCESS } from './error_codes.js';
import Speech2Text from "./s2t.js";
import Spell2Text from "./spell2text.js"
var synth = window.speechSynthesis //for text to speech
var allText = []        //Keeps the user sayings
var sendingInfo = []    
class Email extends React.Component {
    constructor() {
        super();

        //Methods have to be binded to be able to use
        this.inboxFunction = this.inboxFunction.bind(this); //for listing mails that are received.
        this.sentFunction = this.sentFunction.bind(this);   //for listing mails that are sent.
        this.mailContent = this.mailContent.bind(this);     //for displaying the content of the selected mail
        this.sendMail = this.sendMail.bind(this);           //forum for send a mail
        this.handleSendSubmit = this.handleSendSubmit.bind(this);   //For handling inputs to send a mail
        this.handleChange = this.handleChange.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleEnd = this.handleEnd.bind(this);
        this.handleStart = this.handleStart.bind(this);
        this.get_emails = this.get_emails.bind(this);
        this.get_emails_sent = this.get_emails_sent.bind(this);

        this.state = {

            InboxMails: [],     //Keeps all Inbox mails
            SentMails: [],      //Keeps all Sent mails
            //initial mails list div 
            mailsContent: <tr ><td colSpan="2" id="noselected_div">   
                No Folder selected.
            </td></tr>,

            //initial mail body div 
            mailBody: <div className="noselected_div">
                No Mail selected.
            </div>,

            mail_list_header1: "",  //Mails list table header can be changed according to sent or received mail (To/From)
            mail_list_header2: "",  //Holds "Subject" header

            email_to_send: "",  //this states are for saving sending mail info
            subject_to_send: "",
            message_to_send: "",

            utterText: " To Send Email, please say Send Email. To Listen Email, say Listen. and To Exit, say Logout",
            initial: true,
            sendEmail: false,
            inboxEmail: false,
            sentEmail: false,

        };
    }

    //This function converts the text to speech
    text2speech = (text) => {
        synth.cancel()
        var utterThis = new SpeechSynthesisUtterance(text);
        synth.speak(utterThis);
    }

    //when the page is loaded, mails are received
    componentDidMount() {
        this.get_emails();
        this.get_emails_sent();
        document.addEventListener('keypress', this.handleClick)
    }

    componentWillUnmount() {
        synth.cancel()
        document.removeEventListener('keypress', this.handleClick)
    }

    //This function is for receiving inbox emails from backend
    get_emails() {
       axios.post(`${process.env.REACT_APP_API_URL}/api/email/fetch_emails`, { search: "INBOX" }, { withCredentials: true })
            .then((req) => {
                if (req.data.code === SUCCESS) {
                    this.setState({
                        InboxMails: req.data.data
                    });
                }
            })
            .catch(() => {
                // Suppress 404 error without breaking functionality
                this.setState({ InboxMails: [] });
            });
    }
    

    //This function is for receiving sent emails from backend
    get_emails_sent() {
        Axios.post(`${process.env.REACT_APP_API_URL}/api/email/fetch_emails`, { "search": "SENT" }, { withCredentials: true })
            .then((req) => {
                console.log("📨 Sent Emails Response:", req.data);  // ✅ Debugging
    
                if (req.data.code === SUCCESS) {
                    this.setState({ SentMails: req.data.data });
                } else {
                    console.error("❌ Failed to fetch sent emails:", req.data.detail);
                }
            })
            .catch((error) => {
                console.error("❌ API Error fetching sent emails:", error);
            });
    }
    

    //This function shows the inbox mails on the mails list section
    // Modified inboxFunction that reads a summary and asks for an index.
    inboxFunction() {
        const list = this.state.InboxMails.map((item, index) => 
          <tr key={index} onClick={() => this.mailContent(item, 0)}>
            <td>{item.target}</td>
            <td>{item.subject}</td>
          </tr>
        );
      
        this.setState({
          mailsContent: list,
          mail_list_header1: "From",
          mail_list_header2: "Subject",
          readingInboxIndex: true  // Flag indicating inbox index selection mode
        }, () => {
          if (this.state.InboxMails.length > 0) {
            const firstEmail = this.state.InboxMails[0];
            const speechText = `Inbox emails loaded. You have ${this.state.InboxMails.length} emails. The index starts with 00 for the first email, 01 for the second, and so on. Please say the index number of the email you want me to read. For example, say 00 for the first email which is from ${firstEmail.target} with subject ${firstEmail.subject}.`;
            this.text2speech(speechText);
          } else {
            this.text2speech("Inbox emails loaded but your inbox is empty.");
            this.setState({ readingInboxIndex: false });
          }
        });
      }
  //This function shows the sent mails on the mails list section
    sentFunction() {
        const list = this.state.SentMails.map((item, index) =>
          <tr key={index} onClick={() => this.mailContent(item, 1)}>
            <td>{item.target}</td>
            <td>{item.subject}</td>
          </tr>
        );
      
        this.setState({
          mailsContent: list,
          mail_list_header1: "To",
          mail_list_header2: "Subject",
          readingSentIndex: true  // Flag indicating sent emails index selection mode
        }, () => {
          if (this.state.SentMails.length > 0) {
            const firstEmail = this.state.SentMails[0];
            const speechText = `Sent emails loaded. You have ${this.state.SentMails.length} emails. The index starts with 00 for the first email, 01 for the second, and so on. Please say the index number of the email you want me to read. For example, say 00 for the first email which is to ${firstEmail.target} with subject ${firstEmail.subject}.`;
            this.text2speech(speechText);
          } else {
            this.text2speech("Sent emails loaded but you have no sent emails.");
            this.setState({ readingSentIndex: false });
          }
        });
      }
    //This function is for displaying the content of the selected mail
    mailContent(item, id) {

        var from_to = "From: "  //If a received mail is wanted to display, it changes the header of the table
        var address = item.target
        if (id === 1) {
            from_to = "To: "    //If a sent mail is wanted to display
            address = item.target
        }
            
        const content =
            <div className="mailbody_div">
                <table>
                    <tbody>
                    <tr>
                        <td><h5>{from_to} </h5></td>
                        <td> <h6>{address}</h6></td>
                    </tr>

                    <tr>
                        <td><h5>Subject:  </h5></td>
                        <td> <h6>{item.subject}</h6></td>
                    </tr> 
                    </tbody>
                </table>

                <hr size="10"/>
                <p>  {item.content}</p>
            </div>

        this.setState({
            mailBody: content
        });

    }

    //This function changes the mail content div to be able to send a mail, it gives a form: "mail to send", "subject to send" and "message to send"
    sendMail() {
        // Set the flag to show the send-mail form and reset the step.
        this.setState({ sendEmail: true, step: 0 });
      }
      
    
    
    //This function is for exit from the email page
    handleLogout(e) {
        if (e) {
            e.preventDefault();
        }
        Axios.get(`${process.env.REACT_APP_API_URL}/api/auth/logout`, { withCredentials: true })
            .then((req) => {
                // Always provide voice feedback
                this.text2speech("Log out successful");
                this.props.ask_auth();
            })
            .catch((error) => {
                console.error("Logout failed:", error);
                this.text2speech("Logout failed, please try again.");
                this.props.ask_auth();
            });
    }

 //For handling inputs(mail to send, subject and message) from sending mail menu
    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
   
    }

    //This function provide a connection between the database to send email
    handleSendSubmit(e) {
        if (e) {
            e.preventDefault();
        }
    
        console.log("Sending email with:", {
            to: this.state.email_to_send,
            subject: this.state.subject_to_send,
            content: this.state.message_to_send
        },{ withCredentials: true });
    
        Axios.post(`${process.env.REACT_APP_API_URL}/api/email/send_email`, {
    subject: this.state.subject_to_send,
    to: this.state.email_to_send,
    content: this.state.message_to_send
}, { withCredentials: true });
        .then((req) => {
            console.log("Server response:", req.data);  // ✅ Debugging
    
            if (req.data.code === SUCCESS) {
                alert("✅ Email Sent Successfully!");
                this.text2speech("Email sent successfully. To send email, say Send Email. To listen email, say Listen. And to exit, say Logout.");
            } else {
                alert("❌ Error: " + (typeof req.data.detail === "string" ? req.data.detail : JSON.stringify(req.data.detail)));
            }
    
            this.setState({
                email_to_send: "",
                message_to_send: "",
                subject_to_send: ""
            });
        })
        .catch((error) => {
            console.error("Email send failed:", error);
            alert("❌ Error sending email. Check console for details.");
        });
    }
    

    //When the user is pressed the space, the voice assistant starts to inform about the options
    handleClick(e) {
        //e.preventDefault();
        if (e.keyCode === 32) {
            this.text2speech(this.state.utterText)
        }
    }

    //This function starts the speech to text process
    handleStart() {
        this.setState({
            listening: true
        })
        synth.cancel(); 
    }

    //This function ends the speech to text process and speech will be saved
    handleEnd(err, text) {
        console.log("Speech recognition result:", text);
    
        if (err || !text || text.trim() === "") {
            console.log("Speech error or no input detected.");
            this.setState({ listening: false });
            return;
        }

        if (this.state.readingInboxIndex && /^\d+$/.test(text)) {
            const index = parseInt(text, 10);
            if (index >= 0 && index < this.state.InboxMails.length) {
              this.setState({ readingInboxIndex: false });
              const selectedMail = this.state.InboxMails[index];
              this.mailContent(selectedMail, 0);
              // New: Read out the email details
              const speechText = `Reading email from ${selectedMail.target}, subject ${selectedMail.subject}. ${selectedMail.content}`;
              this.text2speech(speechText);
              return;
            } else {
              this.text2speech(`Index ${text} is out of range. Please try again.`);
              return;
            }
          }

          // --- Begin Sent Email Index Block ---
        if (this.state.readingSentIndex && /^\d+$/.test(text)) {
            const index = parseInt(text, 10);
            if (index >= 0 && index < this.state.SentMails.length) {
                this.setState({ readingSentIndex: false });
                const selectedMail = this.state.SentMails[index];
                this.mailContent(selectedMail, 1);
                const speechText = `Reading sent email number ${String(index).padStart(2, '0')}. To: ${selectedMail.target}, Subject: ${selectedMail.subject}. ${selectedMail.content}`;
                this.text2speech(speechText);
                return;
            } else {
                this.text2speech(`Index ${text} is out of range. Please try again.`);
                return;
            }
        }

  

        // ✅ Normalize input: Fix common misinterpretations
        text = text.toLowerCase().trim()
            .replace(/\s+/g, " ")         // Converts multiple spaces into a single space
            .replace(/at the rate/g, "@") // Converts "at the rate" → "@"
            .replace(/period/g, ".");     // Converts "period" → "."
    
        // ✅ Restart process
        if (text === "restart") {
            console.log("Restart command recognized.");
            window.speechSynthesis.cancel(); // Cancel any ongoing utterance
            this.setState({
                step: 0,
                email_to_send: "",
                subject_to_send: "",
                message_to_send: ""
            });
            this.text2speech("Restarting. Please say the recipient's email.");
            return;
        }
        // ✅ Email Sending Process
        if (this.state.sendEmail === true) {
            if (this.state.step === 0) {
                console.log("Captured recipient email:", text);
                this.setState({ 
                    email_to_send: text.replace(/\s+/g, ""), // ✅ Remove spaces in email
                    step: 1 
                }, () => { 
                    this.text2speech("Got it. Now, say the subject.");
                });
            } 
            else if (this.state.step === 1) {
                console.log("Captured subject:", text);
                    this.setState({ subject_to_send: text, step: 2 }, () => {
                      console.log("Step updated to 2: message prompt.");
                      this.text2speech("Got it. Now, say the message.");
                     this.setState({ processingSpeech: false });
                   });
              }
            else if (this.state.step === 2) {
                console.log("Captured message:", text);
                this.setState({ message_to_send: text, step: 3 }, () => {
                this.text2speech(`You said, Email: ${this.state.email_to_send}, Subject: ${this.state.subject_to_send}, Message: ${this.state.message_to_send}. 
                If correct, say 'Submit'. Otherwise, say 'Restart'.`);
                    });
            } 
            else if (text === "submit") {
                console.log("Submitting email...");
                this.handleSendSubmit(null);
            }
        }
    
        // ✅ Menu Handling
        else {
            if (text === "send email" || text === "send message") {
                this.text2speech("Please say the recipient's email. You can say 'at the rate' for '@' and 'period' for '.'");
                this.setState({ step: 0, sendEmail: true, inboxEmail: false, sentEmail: false }, () => {
                     this.sendMail();
                });
            }
            else if (text === "listen") {
                this.text2speech("To listen to Inbox emails, say 'Inbox'. To listen to Sent emails, say 'Sent'. You can say 'Restart' to start over.");
            }
            else if (text === "inbox") {
                // Call the inbox function and provide audio feedback.
                this.inboxFunction();
                this.text2speech("Inbox emails loaded.");
            }
            else if (text === "sent" || text=="send") {
                // Call the sent emails function and provide audio feedback.
                this.sentFunction();
                this.text2speech("Sent emails loaded.");
            }
            else if (text === "logout") {
                console.log("Logging out...");
                this.handleLogout(null);
            }
            else {
                this.text2speech("Wrong option, please say again.");
            }
        }
    }
    render() {

         //Voice assistant informs the user about success login in the initial load
        if (this.state.initial === true) {
            this.setState({
                initial: false
            })
            this.text2speech("Login successful")
            this.text2speech("To Listen to menu, please hit the spacebar")
        } 
        
      return (
        
          //Layout: "main div=> app_div(has all subdivs)", "header div", "menu div(left side)", "mails list div" and "mail content div"
          <div className="flex-centered">
              <Speech2Text onStart={this.handleStart} onEnd={this.handleEnd} />
              <Spell2Text onStart={this.handleStart} onEnd={this.handleEnd} />
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
                          <li className="menu-item" onClick={this.sendMail}><a href=" #top">Send Email</a>     
                                </li>
                                <li  className="menu-item">
                                    <a href="#top">Listen Email</a>
                                </li> 
                          <li className="menu-item"><a href="#top" onClick={this.handleLogout}>Logout</a>
                                </li> 
                          </ul>

                      <div className="mailbox_div">
                          <h4>Folders</h4>
                          <ul className="mailboxitem_div">

                              <li className="item_div" key={0}>

                                  <button className="btn badge" data-badge={this.state.InboxMails.length} onClick={this.inboxFunction}>
                                      Inbox
                                   </button>

                              </li>

                              <li className="item_div" key={1}>

                                  <button className="btn badge" data-badge={this.state.SentMails.length} onClick={this.sentFunction}>
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
                                  <th width="70%">{this.state.mail_list_header1}</th>
                                  <th width="30%">{this.state.mail_list_header2}</th>
                                 
                              </tr>
                          </thead>
                          <tbody>
                              {this.state.mailsContent}
                          </tbody>
                      </table>
                      
                  </div>

                  <div className="mailcontent_div">
  {this.state.sendEmail ? (
    <form className="form-horizontal" action="#forms" onSubmit={this.handleSendSubmit}>
      <div className="form-group">
        <div className="col-3 col-sm-12">
          <label className="form-label" htmlFor="input-example-4"><h5>To: </h5></label>
        </div>
        <div className="col-9 col-sm-12">
          <input
            className="form-input"
            id="address"
            type="email"
            placeholder="Email"
            name="email_to_send"
            value={this.state.email_to_send}
            onChange={this.handleChange}
          />
        </div>
      </div>
      <div className="form-group">
        <div className="col-3 col-sm-12">
          <label className="form-label" htmlFor="input-example-5"><h5>Subject: </h5></label>
        </div>
        <div className="col-9 col-sm-12">
          <input
            className="form-input"
            id="subject"
            type="text"
            placeholder="Subject"
            name="subject_to_send"
            value={this.state.subject_to_send}
            onChange={this.handleChange}
          />
        </div>
      </div>
      <div className="form-group">
        <div className="col-3 col-sm-12">
          <label className="form-label" htmlFor="input-example-6"><h5>Message: </h5></label>
        </div>
        <div className="col-9 col-sm-12">
          <textarea
            className="form-input"
            id="message"
            placeholder="Textarea"
            rows="3"
            name="message_to_send"
            value={this.state.message_to_send}
            onChange={this.handleChange}
          ></textarea>
        </div>
      </div>
      <div className="form-group">
        <div className="btn-group btn-group-block">
          <button className="btn btn-lg" id="sendemail_button" type="submit">Send Email</button>
        </div>
      </div>
    </form>
  ) : (
    this.state.mailBody
  )}
            </div>


              </div>
           

          </div>
      )
  }
}

export default Email;
