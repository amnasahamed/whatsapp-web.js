#!/bin/bash

# Start Xvfb (virtual display)
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99

# Start window manager
fluxbox &

# Start VNC server (no password for simplicity, use -usepw for password)
x11vnc -display :99 -forever -nopw -quiet &

# Wait a moment for services to start
sleep 2

# Run the application
node /app/example.js
