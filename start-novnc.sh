#!/bin/bash

# Start Xvfb (virtual display)
Xvfb :99 -screen 0 1920x1080x24 &
export DISPLAY=:99

# Start window manager
fluxbox &

# Start VNC server
x11vnc -display :99 -forever -nopw -quiet -localhost &

# Wait for VNC to start
sleep 2

# Start noVNC
/opt/novnc/utils/novnc_proxy --vnc localhost:5900 --listen 6080 &

echo "========================================"
echo "noVNC started!"
echo "Open your browser and go to:"
echo "http://localhost:6080/vnc.html"
echo "========================================"

# Run the application
node /app/example.js
