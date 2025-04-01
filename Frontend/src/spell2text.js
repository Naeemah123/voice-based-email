import React from 'react';

// Audio feedback - create context only once
let audioContext;
function beep(vol, freq, duration){
  // Create context on first use if not already created
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error("Failed to create AudioContext:", e);
      return;
    }
  }
  
  try {
    var v = audioContext.createOscillator();
    var u = audioContext.createGain();
    v.connect(u);
    v.frequency.value = freq;
    v.type = "square";
    u.connect(audioContext.destination);
    u.gain.value = vol * 0.01;
    v.start(audioContext.currentTime);
    v.stop(audioContext.currentTime + duration * 0.001);
  } catch (e) {
    console.error("Error playing beep:", e);
  }
}

class Spell2Text extends React.Component {
  constructor() {
    super();
    
    // Create a fresh recognition instance
    this.createRecognitionInstance();
    
    this.state = {
      listening: false,
      started: false,
      text: "",
      buffer: "" // Add a buffer to store accumulated spelled letters
    };
    
    this.toggleListen = this.toggleListen.bind(this);
    this.handleListen = this.handleListen.bind(this);
  }
  
  // Create a fresh speech recognition instance
  createRecognitionInstance() {
    // First, clean up any existing instance
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onstart = null;
      
      if (this.state && this.state.started) {
        try {
          this.recognition.abort();
        } catch (e) {
          console.log("Error aborting previous recognition instance:", e);
        }
      }
    }
    
    // Create new instance
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.recognition.continuous = true; // Set to true to capture multiple utterances
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    // Set up base handlers
    this.recognition.onstart = () => {
      console.log("Listening started on fresh instance!");
      this.setState({ buffer: "" }); // Reset buffer when starting fresh
    };
    
    this.recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      this.setState({ started: false, listening: false });
    };
  }
  
  componentDidMount() {
    document.addEventListener('keypdown', this.toggleListen);
  }
  
  componentWillUnmount() {
    document.removeEventListener("keydown", this.toggleListen);
    if (this.state.started) {
      this.recognition.abort();
    }
  }
  
  // Force a reset of the recognition system
  resetRecognition() {
    console.log("🔄 Completely resetting recognition");
    this.setState({ 
      listening: false,
      started: false,
      text: "",
      buffer: "" // Clear the buffer
    }, () => {
      this.createRecognitionInstance();
    });
  }
  
  toggleListen(event) {
    // Check for ESC key (keyCode 27)
    if (event.keyCode === 27) {
      console.log("ESC pressed - toggling listening state");
      
      if (!this.state.listening) {
        beep(20, 100, 150); // Listen Start Noise
      } else {
        beep(20, 200, 150); // Listen End Noise
        
        // If stopping, finalize the input
        if (this.state.buffer && this.props.onEnd) {
          console.log("Finalizing input:", this.state.buffer);
          this.props.onEnd(null, this.state.buffer);
        }
      }
      
      // Always reset recognition on toggle
      this.createRecognitionInstance();
      
      this.setState({
        listening: !this.state.listening
      }, this.handleListen);
    }
  }
  
  handleListen() {
    if (this.state.listening && !this.state.started) {
      // Always create a fresh instance when starting to listen
      this.createRecognitionInstance();
      
      // Setup the result handler to process spelled letters
      this.recognition.onresult = (event) => {
        // Get the latest result
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        
        console.log("🎤 Raw Speech Input:", transcript);
        
        if (!transcript) {
          console.log("⚠️ No speech detected!");
          return;
        }
        
        // Process the transcript for special command words
        let processedText = "";
        
        // Check for special symbols and commands
        if (transcript === "space") {
          processedText = " ";
        } else if (transcript === "at" || transcript === "at sign" || transcript === "at the rate") {
          processedText = "@";
        } else if (transcript === "dot" || transcript === "period" || transcript === "point") {
          processedText = ".";
        } else if (transcript === "underscore") {
          processedText = "_";
        } else if (transcript === "dash" || transcript === "hyphen") {
          processedText = "-";
        } else if (transcript === "clear" || transcript === "reset") {
          // Reset the buffer
          this.setState({ buffer: "" });
          return;
        } else if (transcript === "done" || transcript === "finished" || transcript === "complete") {
          // Finalize input
          console.log("✅ Final spelled input:", this.state.buffer);
          this.setState({ listening: false, started: false }, () => {
            if (this.props.onEnd) {
              this.props.onEnd(null, this.state.buffer);
            }
          });
          return;
        } else {
          // Take the first letter of the spoken letter name
          // e.g., "alpha" -> "a", "bravo" -> "b", etc.
          const words = transcript.split(/\s+/);
          for (const word of words) {
            if (word.length === 1) {
              // Single letter directly spoken
              processedText += word;
            } else if (["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", 
                       "hotel", "india", "juliet", "kilo", "lima", "mike", "november", 
                       "oscar", "papa", "quebec", "romeo", "sierra", "tango", "uniform", 
                       "victor", "whiskey", "xray", "yankee", "zulu"].includes(word)) {
              // NATO phonetic alphabet
              processedText += word.charAt(0);
            } else if (word === "zero" || word === "one" || word === "two" || word === "three" || 
                      word === "four" || word === "five" || word === "six" || word === "seven" || 
                      word === "eight" || word === "nine") {
              // Numbers spoken as words
              const numberMap = {
                "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
                "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9"
              };
              processedText += numberMap[word];
            } else {
              // For any other word, just take the first letter
              processedText += word.charAt(0);
            }
          }
        }
        
        // Update the buffer with the new processed text
        const updatedBuffer = this.state.buffer + processedText;
        console.log("✅ Updated buffer:", updatedBuffer);
        
        this.setState({ buffer: updatedBuffer });
      };
      
      // Set up end handler
      this.recognition.onend = () => {
        console.log("Recognition session ended");
        
        // If still in listening mode, restart recognition
        if (this.state.listening) {
          console.log("Still in listening mode, restarting recognition");
          setTimeout(() => {
            try {
              this.recognition.start();
              this.setState({ started: true });
            } catch (e) {
              console.error("Error restarting recognition:", e);
            }
          }, 100);
        } else {
          this.setState({ started: false });
        }
      };
      
      // Start recognition
      try {
        this.recognition.start();
        this.setState({ started: true });
        
        if (this.props.onStart) {
          this.props.onStart();
        }
      } catch (e) {
        console.error("Error starting recognition:", e);
        this.resetRecognition();
      }
    } else if (!this.state.listening && this.state.started) {
      // Stop recognition if we're no longer listening
      this.recognition.stop();
      this.setState({ started: false });
    }
  }
  
  render() {
    return (
      <div className="speech-recognition-status">
        {this.state.listening ? (
          <div className="listening-indicator">
            <div>Spelling Mode: Listening...</div>
            <div className="current-buffer">{this.state.buffer}</div>
          </div>
        ) : (
          <div className="press-esc-prompt">Press ESC to start spelling</div>
        )}
      </div>
    );
  }
}

export default Spell2Text;