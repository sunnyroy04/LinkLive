// src/VideoCall.js
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const SOCKET_SERVER_URL = "https://5693f6fc396f.ngrok-free.app"; 

export default function VideoCall() {
  const { roomId } = useParams();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const canvasRef = useRef(null);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const pcRef = useRef(null);

  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [status, setStatus] = useState("Initializing...");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        localStreamRef.current = stream;

        socketRef.current.emit("join", roomId);
        setStatus(`Joined room: ${roomId}`);
      })
      .catch((e) => {
        console.error(e);
        setStatus("Failed to get local media");
      });

    socketRef.current.on("created", (room) => {
      console.log("Room created:", room);
      setStatus("Waiting for peer...");
    });

    socketRef.current.on("ready", () => {
      console.log("Peer ready");
      setStatus("Peer joined, starting call");
      createPeerConnection();
      if (pcRef.current) {
        pcRef.current.createOffer().then((offer) => {
          pcRef.current.setLocalDescription(offer);
          socketRef.current.emit("offer", offer, roomId);
        });
      }
    });

    socketRef.current.on("offer", async (offer) => {
      console.log("Received offer");
      if (!pcRef.current) createPeerConnection();
      await pcRef.current.setRemoteDescription(offer);
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socketRef.current.emit("answer", answer, roomId);
    });

    socketRef.current.on("answer", async (answer) => {
      console.log("Received answer");
      await pcRef.current.setRemoteDescription(answer);
    });

    socketRef.current.on("candidate", async (candidate) => {
      try {
        await pcRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.error("Error adding candidate", err);
      }
    });

    socketRef.current.on("full", () => {
      alert("Room is full");
      setStatus("Room full");
    });

    return () => {
      socketRef.current.disconnect();
      pcRef.current?.close();
    };
  }, [roomId]);

  function createPeerConnection() {
    pcRef.current = new RTCPeerConnection();

    localStreamRef.current.getTracks().forEach((track) => {
      pcRef.current.addTrack(track, localStreamRef.current);
    });

    pcRef.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    };

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("candidate", event.candidate, roomId);
      }
    };
  }

  // Draw local and remote videos side-by-side on canvas for recording
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    let animationFrameId;

    function draw() {
      ctx.clearRect(0, 0, width, height);

      if (localVideoRef.current.readyState === 4) {
        ctx.drawImage(localVideoRef.current, 0, 0, width / 2, height);
      }
      if (remoteVideoRef.current.readyState === 4) {
        ctx.drawImage(remoteVideoRef.current, width / 2, 0, width / 2, height);
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  function startRecording() {
    recordedChunksRef.current = [];

    const canvasStream = canvasRef.current.captureStream(30);
    const localAudioTracks = localStreamRef.current?.getAudioTracks() || [];
    const remoteAudioTracks = remoteStreamRef.current?.getAudioTracks() || [];

    [...localAudioTracks, ...remoteAudioTracks].forEach((track) => {
      canvasStream.addTrack(track);
    });

    mediaRecorderRef.current = new MediaRecorder(canvasStream, {
      mimeType: "video/webm; codecs=vp8,opus",
    });

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${roomId}-merged-video.webm`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Recording downloaded");
    };

    mediaRecorderRef.current.start();
    setStatus("Recording...");
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff((prev) => !prev);
  };

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>Room: {roomId}</h2>
      <p>Status: {status}</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "50%",
            border: "2px solid green",
            borderRadius: 8,
            backgroundColor: isCameraOff ? "#333" : "black",
            filter: isCameraOff ? "blur(2px)" : "none",
          }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: "50%",
            border: "2px solid blue",
            borderRadius: 8,
            backgroundColor: "black",
          }}
        />
      </div>

      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        style={{ display: "none" }}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={startRecording} style={{ padding: "10px 20px" }}>
          Start Recording
        </button>
        <button onClick={stopRecording} style={{ padding: "10px 20px" }}>
          Stop Recording
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button onClick={toggleMute} style={{ padding: "10px 20px" }}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button onClick={toggleCamera} style={{ padding: "10px 20px" }}>
          {isCameraOff ? "Turn Video On" : "Turn Video Off"}
        </button>
      </div>
    </div>
  );
}
