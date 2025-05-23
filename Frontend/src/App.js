import React from 'react';
import Welcome from "./welcome"
import Email from "./email"
import axios from "axios"
import {SUCCESS} from "./error_codes"

class App extends React.Component {
  constructor(){
    super();
    this.state = { 
      auth: false
    }
    this.check_auth = this.check_auth.bind(this);
  }
  check_auth() {
    axios.get(`${process.env.REACT_APP_API_URL}/api/auth/fetch_user`, {withCredentials: true,})
        .then((req) => {
            console.log("Auth Check Response:", req.data);  // ✅ Debugging

            if (req.data.code === 200) {  // ✅ Ensuring correct success check
                this.setState({ auth: true }, () => {
                    console.log("✅ User authenticated, updating UI...");
                });
            } else {
                this.setState({ auth: false }, () => {
                    console.log("❌ Not authenticated, showing login page...");
                });
            }
        })
        .catch((error) => {
            console.error("❌ Auth check failed:", error.message);
            this.setState({ auth: false });
        });
}



  componentDidMount(){
    this.check_auth()
  }
    render() {
      return (
        <div className="container">
            <div className="columns">
            <div className="col-4 col-lg-3 col-md-2 col-sm-1 col-xs-0"></div>

            <div className="col-4 col-lg-6  col-md-8 col-sm-10 col-xs-12">
              {this.state.auth ? <Email ask_auth={this.check_auth}/> : <Welcome ask_auth={this.check_auth}/> }
            </div>

            <div className="col-4 col-lg-3 col-md-2 col-sm-1 col-xs-0"></div>
            </div>
        </div>
      )
  }

}




export default App;
