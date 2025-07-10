// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VideoCall from "./VideoCall";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/room/:roomId" element={<VideoCall />} />
        <Route
          path="*"
          element={
            <div style={{ padding: 20 }}>
              <h1>Welcome!</h1>
              <p>
                To start a call, go to <code>/room/your-room-name</code> in the
                URL.
              </p>
              <p>Example: <a href="/room/test123">/room/test123</a></p>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
