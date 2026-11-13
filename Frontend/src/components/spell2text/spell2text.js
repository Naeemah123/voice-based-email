import React, { useState, useEffect, useRef } from 'react';

let audioContext;

function beep(vol, freq, duration) {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
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
        return;
    }
}

function Spell2Text({ onStart, onEnd }) {
    const [listening, setListening] = useState(false);
    const [started, setStarted] = useState(false);
    const [text, setText] = useState("");
    const [buffer, setBuffer] = useState("");

    const recognition = useRef(null);
    const listeningRef = useRef(false);
    const bufferRef = useRef("");

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) return;

        recognition.current = new SpeechRecognition();
        recognition.current.continuous = true;
        recognition.current.interimResults = false;
        recognition.current.lang = 'en-US';

        recognition.current.onstart = () => {
            setStarted(true);
            setBuffer("");
            bufferRef.current = "";
        };

        recognition.current.onerror = () => {
            setStarted(false);
            setListening(false);
            listeningRef.current = false;
        };

        return () => {
            document.removeEventListener('keydown', toggleListen);

            if (recognition.current) {
                recognition.current.onresult = null;
                recognition.current.onend = null;
                recognition.current.onerror = null;
                recognition.current.onstart = null;
                recognition.current.abort();
            }
        };
    }, []);

    const processTranscript = (transcript) => {
        let processedText = "";

        if (transcript === "space") {
            processedText = " ";
        } else if (["at", "at sign", "at the rate"].includes(transcript)) {
            processedText = "@";
        } else if (["dot", "period", "point"].includes(transcript)) {
            processedText = ".";
        } else if (transcript === "underscore") {
            processedText = "_";
        } else if (["dash", "hyphen"].includes(transcript)) {
            processedText = "-";
        } else if (["clear", "reset"].includes(transcript)) {
            setBuffer("");
            bufferRef.current = "";
            return;
        } else if (["done", "finished", "complete"].includes(transcript)) {
            setListening(false);
            listeningRef.current = false;
            setStarted(false);

            if (onEnd) {
                onEnd(null, bufferRef.current);
            }

            return;
        } else {
            const words = transcript.split(/\s+/);

            const phoneticAlphabet = [
                "alpha", "bravo", "charlie", "delta", "echo", "foxtrot",
                "golf", "hotel", "india", "juliet", "kilo", "lima",
                "mike", "november", "oscar", "papa", "quebec", "romeo",
                "sierra", "tango", "uniform", "victor", "whiskey",
                "xray", "yankee", "zulu"
            ];

            const numberMap = {
                zero: "0",
                one: "1",
                two: "2",
                three: "3",
                four: "4",
                five: "5",
                six: "6",
                seven: "7",
                eight: "8",
                nine: "9"
            };

            for (const word of words) {
                if (word.length === 1) {
                    processedText += word;
                } else if (phoneticAlphabet.includes(word)) {
                    processedText += word.charAt(0);
                } else if (numberMap[word] !== undefined) {
                    processedText += numberMap[word];
                } else {
                    processedText += word.charAt(0);
                }
            }
        }

        const updatedBuffer = bufferRef.current + processedText;

        bufferRef.current = updatedBuffer;
        setBuffer(updatedBuffer);
    };

    const handleListen = () => {
        if (!recognition.current) return;

        if (listeningRef.current) {
            recognition.current.onresult = (event) => {
                const lastResultIndex = event.results.length - 1;
                const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();

                if (!transcript) return;

                processTranscript(transcript);
            };

            recognition.current.onend = () => {
                if (listeningRef.current) {
                    setTimeout(() => {
                        try {
                            recognition.current.start();
                        } catch (e) {
                            setStarted(false);
                        }
                    }, 100);
                } else {
                    setStarted(false);
                }
            };

            try {
                recognition.current.start();
                setStarted(true);

                if (onStart) {
                    onStart();
                }
            } catch (e) {
                setListening(false);
                listeningRef.current = false;
                setStarted(false);
            }
        } else if (started) {
            recognition.current.stop();
            setStarted(false);
        }
    };

    const toggleListen = (event) => {
        if (event.keyCode === 27) {
            if (!listeningRef.current) {
                beep(20, 100, 150);
            } else {
                beep(20, 200, 150);

                if (bufferRef.current && onEnd) {
                    onEnd(null, bufferRef.current);
                }
            }

            const newListening = !listeningRef.current;

            listeningRef.current = newListening;
            setListening(newListening);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', toggleListen);

        return () => {
            document.removeEventListener('keydown', toggleListen);
        };
    }, [listening, started, buffer]);

    useEffect(() => {
        if (listening) {
            handleListen();
        } else if (started && recognition.current) {
            recognition.current.stop();
            setStarted(false);
        }
    }, [listening]);

    return (
        <div className="speech-recognition-status">
            {listening ? (
                <div className="listening-indicator">
                    <div>Spelling Mode: Listening...</div>
                    <div className="current-buffer">{buffer}</div>
                </div>
            ) : (
                <div className="press-esc-prompt">Press ESC to start spelling</div>
            )}
        </div>
    );
}

export default Spell2Text;