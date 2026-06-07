import { useState } from "react";
import axios from "axios";

export default function VideoPanel() {
    const [cameraUrl, setCameraUrl] = useState("");
    const [videoFile, setVideoFile] = useState("");
    const [currentSource, setCurrentSource] = useState("");

    const startCamera = async () => {
        if (!cameraUrl) return alert("Enter camera URL");

        await axios.post("http://127.0.0.1:8001/start-detection", {
            source: cameraUrl,
        });

        setCurrentSource(cameraUrl);
    };

    const startVideo = async () => {
        if (!videoFile) return alert("Enter video file");

        await axios.post("http://127.0.0.1:8001/start-detection", {
            source: videoFile,
        });

        setCurrentSource(videoFile);
    };

    return (
        <div className="bg-[#0f1720] p-5 rounded-xl border border-gray-800 space-y-5">

            {/* TITLE */}
            <div>
                <p className="text-green-400 text-sm">INPUT SOURCE</p>
                <h2 className="text-xl font-semibold">
                    Connect camera or test video
                </h2>
            </div>

            {/* INPUT ROW */}
            <div className="grid grid-cols-2 gap-4">

                {/* CAMERA */}
                <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Camera URL</p>

                    <div className="flex gap-2">
                        <input
                            value={cameraUrl}
                            onChange={(e) => setCameraUrl(e.target.value)}
                            placeholder="rtsp://192.168.1.10/stream"
                            className="bg-black p-2 w-full rounded border border-gray-700 focus:outline-none"
                        />

                        <button
                            onClick={startCamera}
                            className="bg-gray-800 hover:bg-gray-700 px-4 rounded"
                        >
                            Connect
                        </button>
                    </div>
                </div>

                {/* VIDEO */}
                <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Test Video</p>

                    <div className="flex gap-2">
                        <input
                            value={videoFile}
                            onChange={(e) => setVideoFile(e.target.value)}
                            placeholder="test.mp4"
                            className="bg-[#1f2937] p-2 w-full rounded border border-gray-700 focus:outline-none"
                        />

                        <button
                            onClick={startVideo}
                            className="bg-gray-800 hover:bg-gray-700 px-4 rounded"
                        >
                            Load
                        </button>
                    </div>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3">
                <button className="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700">
                    Simulation
                </button>

                <button className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">
                    Run Pose
                </button>
            </div>

            {/* STATUS */}
            <div className="text-sm text-gray-400">
                Current source:{" "}
                <span className="text-white">
                    {currentSource || "None"}
                </span>
            </div>

            {/* VIDEO AREA */}
            <img
                key={Date.now()}   // 🔥 force reload
                src="http://127.0.0.1:8001/video_feed"
                alt="Live Feed"
                className="w-full h-[400px] object-cover rounded border border-gray-700"
            />
        </div>
    );
}