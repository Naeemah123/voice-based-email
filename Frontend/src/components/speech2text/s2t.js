import React, { useState, useEffect, useRef } from 'react';

var a = new AudioContext();

function beep(vol, freq, duration) {
    var v = a.createOscillator();
    var u = a.createGain();

    v.connect(u);
    v.frequency.value = freq;
    v.type = "square";
    u.connect(a.destination);
    u.gain.value = vol * 0.01;
    v.start(a.currentTime);
    v.stop(a.currentTime + duration * 0.001);
}

function Speech2Text(props) {
    const recognition = useRef(null);

    const [listening, setListening] = useState(false);
    const [started, setStarted] = useState(false);
    const [text, setText] = useState("");

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        recognition.current = new SpeechRecognition();
        recognition.current.continuous = true;
        recognition.current.interimResults = false;
        recognition.current.lang = 'en-US';

        const toggleListen = (event) => {
            if (event.keyCode === 27) {
                if (!listening) {
                    beep(20, 100, 150);
                } else {
                    beep(20, 200, 150);
                }

                setListening(prev => !prev);
            }
        };

        document.addEventListener('keyup', toggleListen);

        return () => {
            document.removeEventListener('keyup', toggleListen);

            if (started) {
                recognition.current.stop();
            }
        };
    }, []);

    useEffect(() => {
        if (!recognition.current) return;

        if (listening) {
            if (!started) {
                recognition.current.start();
                setStarted(true);
                props.onStart();

                recognition.current.onend = () => {
                    recognition.current.start();
                };
            }
        } else if (started) {
            recognition.current.stop();

            recognition.current.onend = () => {
                setStarted(false);
            };
        }

        recognition.current.onstart = () => {};

        recognition.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();

            if (transcript !== text) {
                setText(transcript);
                setListening(false);
                props.onEnd(null, transcript);
            }
        };

        recognition.current.onerror = (event) => {
            props.onEnd(event.error, null);
        };
    }, [listening, started, text, props]);

    return (
        <div></div>
    );
}

export default Speech2Text;