import React from 'react';
var a=new AudioContext() // browsers limit the number of concurrent audio contexts, so you better re-use'em
function beep(vol, freq, duration){
 var v=a.createOscillator()
 var u=a.createGain()
  v.connect(u)
  v.frequency.value=freq
  v.type="square"
  u.connect(a.destination)
  u.gain.value=vol*0.01
  v.start(a.currentTime)
  v.stop(a.currentTime+duration*0.001)
}

class Speech2Text extends React.Component {
  constructor() {
    super()
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
    this.recognition.continuous = true
    this.recognition.interimResults = false
    this.recognition.lang = 'en-US'
    this.state = {
      listening: false,
      started: false,
      text: ""
    }
    this.toggleListen = this.toggleListen.bind(this)
    this.handleListen = this.handleListen.bind(this)
  }


  componentDidMount(){
    document.addEventListener('keyup', this.toggleListen)
  }

  componentWillUnmount() {
    document.removeEventListener("keyup", this.toggleListen)
    // ADD this code:
    if (this.state.started) {
      this.recognition.stop()
    }
  }

  toggleListen(event) {
    if (event.keyCode ===  27) {
      if (!this.state.listening) {
        beep(20,100,150) //Listen Start Noise
      } else {
        beep(20,200,150) //Listen Start Noise
      }
      this.setState({
        listening: !this.state.listening
      }, this.handleListen)
    }
  }
    
 
  handleListen(){
    if (this.state.listening) {
      if (!this.state.started) {
        this.recognition.start()
        this.setState({started: true})
        this.props.onStart()
        this.recognition.onend = () => {
          console.log("...continue listening...")
          this.recognition.start()
        }
      }
    } else {
      this.recognition.stop()
      this.recognition.onend = () => {
        this.setState({started: false})
        console.log("Stopped Listening per click")
      }
    }

    this.recognition.onstart = () => {
      console.log("Listening!")
    }

    /*this.recognition.onresult = (event) => {
        var transcript = event.results[0][0].transcript
        this.setState({
          listening: false
        })
        this.props.onEnd(null, transcript)
    }*/
        this.recognition.onresult = (event) => {
          console.log("Full recognition event:", event);
          const transcript = event.results[0][0].transcript.trim();
      
          // Prevent repeating the last recognized phrase
          if (transcript !== this.state.text) {
              this.setState({ text: transcript, listening: false });
              this.props.onEnd(null, transcript);
          } else {
              console.log("Duplicate input detected, ignoring...");
          }
      };

      
      

    this.recognition.onerror = event => {
      this.props.onEnd(event.error, null)
    }
  }
  render() {
    return (<div>
    </div>);
  }
  
}

export default Speech2Text;
