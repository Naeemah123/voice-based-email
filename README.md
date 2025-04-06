# Voice-Based Email System

A web application designed for visually challenged users, enabling them to create accounts, log in, send, and read emails using voice commands. The system leverages speech-to-text and text-to-speech capabilities, allowing users to navigate and operate the app with simple voice commands and the Escape key to start/stop speech recognition.

## Overview

This project is a custom email system that uses fake email addresses (i.e., not connected to Gmail, Yahoo, etc.). All account data and emails are stored in a PostgreSQL database. The key features include:

 • Voice-Activated Interface: Users navigate and perform operations (login, sign up, send/read emails) using voice commands.

 • Speech-to-Text & Text-to-Speech: Converts spoken commands into text for processing and reads out instructions and email content.

 • Session Management: Ensures persistent login sessions using server-managed sessions.
 • Database-Backed Email Storage: Sent and received emails are stored in separate database tables for efficient management.
 • Frontend and Backend Separation: The project is organized into two folders: frontend and backend.


## Features

### Account Management: 
• Sign Up: Create a new account using voice commands. 
• Login: Log in using voice commands with email and password input.

### Voice Navigation: 
• Activation: Use the Escape key to toggle speech recognition. 
• Menu Options: Users can say commands such as "Send Email", "Listen", "Inbox", "Sent", and "Logout".

### Email Operations: 
• Send Emails: Fill out a form using voice commands to send emails.
• Read Emails: Browse and read Inbox and Sent emails using voice-directed index selection.

### Database Integration: • Uses PostgreSQL for persisting user accounts and email data.


## Technologies Used

### Frontend: 
• React 
• Axios • Spectre.css (UI Framework) 
• Browser Web Speech APIs (SpeechRecognition & SpeechSynthesis)

### Backend:
• Node.js
• Express
• PostgreSQL (via the pg module) 
• Session management with express-session


## Setup and Installation

Prerequisites: 
• Node.js (version 12+ recommended) 
• PostgreSQL database 
• npm package manager

## Installation Steps:

1. Clone the Repository: 
git clone <repository-url> 
cd <repository-directory>


2. Backend Setup: 
• Navigate to the backend folder: cd backend 
• Install backend dependencies: npm install 
• Create a .env file in the backend directory with the following environment variables:        DB_USER=your_db_username DB_PASSWORD=your_db_password DB_HOST=your_db_host DB_NAME=your_db_name DB_PORT=your_db_port SESSION_SECRET=your_session_secret 
• Ensure your PostgreSQL database is running and that the required tables (users, sent_emails, received_emails) exist.


3. Frontend Setup: 
• Open a new terminal window/tab and navigate to the frontend folder: cd frontend 
• Install frontend dependencies: npm install



Running the Application

Starting the Backend Server: From the backend directory, run: node app.js.

Starting the Frontend: In the frontend directory, run: npm start.

## Usage

1. Launch the Application: Open the frontend URL in your browser.


2. Voice Commands: 
• Activation: Press the Escape key to toggle speech recognition. 
• Menu Navigation: 
     - Say "New account" or "Login" to begin account setup or authentication.  
     - Once logged in, say "Send Email" to compose a new email, or "Listen" to browse your Inbox and Sent emails.  
     - Use index numbers (e.g., "00" for the first email) when prompted.  
     - Say "Logout" to exit your account. • Audio Prompts: The system provides audio instructions to guide you through each process.


3. Manual Inputs (Optional): Standard HTML forms are available for users who prefer typing over voice commands.