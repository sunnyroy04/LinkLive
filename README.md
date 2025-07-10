# LinkLive - Real-Time Video Calling and Recording App

LinkLive is a full-stack web application that enables peer-to-peer video calling with recording functionality. Users can join a shared room, see each other's video/audio feeds side by side, mute/unmute, turn video on/off, and download the full merged session as a `.webm` file. Ideal for lightweight real-time communication demos.

## 🔧 Tech Stack

**Frontend:**
- React.js
- WebRTC
- Socket.IO Client
- MediaRecorder API
- HTML5 Canvas

**Backend:**
- Node.js
- Express.js
- Socket.IO

**DevOps & Utilities:**
- ngrok (for public HTTPS tunneling during local testing)  
- **Future Scope**: Docker, GitHub Actions, HTTPS (Let's Encrypt), AWS S3/EC2, MongoDB, Redis

---

## 🛠 Setup Instructions

### Backend

```bash
cd server
npm install
node index.js
```

Server runs on: `http://localhost:3001`

### Frontend

```bash
cd client
npm install
npm start
```

App opens at: `http://localhost:3000`

---

## 🌐 Access via ngrok

To expose your signaling server publicly:

```bash
ngrok http 3001
```

Update the `SOCKET_SERVER_URL` in `VideoCall.js` to use the ngrok HTTPS URL, e.g.:
```js
const SOCKET_SERVER_URL = "https://your-ngrok-subdomain.ngrok-free.app";
```

---

## 🎥 Features

- Join rooms via URL (e.g. `/room/your-room`)
- Real-time video calling using WebRTC
- Merged audio + video recording via MediaRecorder
- Download `.webm` file of the session
- Mute / Unmute microphone
- Toggle camera on / off
- Canvas-based layout to display both videos
- Responsive layout

---

## 📦 Build for Production

```bash
npm run build
```

Builds the React app into the `build` folder, optimized for deployment.

---

## 📚 Future Enhancements

- User authentication and room locking
- Integrated text chat
- Screen sharing
- Store recordings on AWS S3
- Docker-based deployment
- HTTPS via Let's Encrypt
- CI/CD with GitHub Actions
- Scalable backend infrastructure with Redis and load balancing

---

## 📂 Repository

GitHub: [https://github.com/sunnyroy04/LinkLive](https://github.com/sunnyroy04/LinkLive)

---

## 📝 License

This project is licensed under the MIT License.
