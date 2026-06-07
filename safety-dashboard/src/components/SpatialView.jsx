import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import { useState, useEffect } from "react";
import * as THREE from "three";


// ==========================
// COCO Skeleton Connections
// ==========================
const BONES = [
    [0, 1], [0, 2], [1, 3], [2, 4],
    [5, 6],
    [5, 7], [7, 9],
    [6, 8], [8, 10],
    [5, 11], [6, 12], [11, 12],
    [11, 13], [13, 15],
    [12, 14], [14, 16]
];

// ==========================
// Convert 2D Pose → 3D Space
// ==========================
function map2Dto3D(x, y, frameW, frameH) {
    return [
        ((x / frameW) - 0.5) * 4,
        (1 - (y / frameH)) * 2,
        0
    ];
}

// ==========================
// Person Skeleton
// ==========================
function PersonSkeleton({ person }) {
    const {
        keypoints = [],
        violations = [],
        frame_width = 640,
        frame_height = 480,
    } = person;

    const hasViolation = violations.length > 0;

    const color = hasViolation
        ? "#ff3333"
        : "#00e5ff";

    const pts = keypoints.map(([x, y]) =>
        map2Dto3D(x, y, frame_width, frame_height)
    );

    return (
        <group>

            {/* JOINTS */}
            {pts.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.05, 8, 8]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            ))}

            {/* BONES */}
            {BONES.map(([a, b], i) => {
                if (!pts[a] || !pts[b]) return null;

                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(...pts[a]),
                    new THREE.Vector3(...pts[b]),
                ]);

                return (
                    <line key={i} geometry={geometry}>
                        <lineBasicMaterial color={color} />
                    </line>
                );
            })}
        </group>
    );
}

function RoomWalls({ points }) {

    const walls = [];

    for (let i = 0; i < points.length; i++) {

        const start = points[i];
        const end = points[(i + 1) % points.length];

        const dx = end[0] - start[0];
        const dz = end[1] - start[1];

        const length = Math.sqrt(dx * dx + dz * dz);

        const centerX = (start[0] + end[0]) / 2;
        const centerZ = (start[1] + end[1]) / 2;

        const angle = Math.atan2(dz, dx);

        walls.push(
            <mesh
                key={i}
                position={[centerX, 1, centerZ]}
                rotation={[0, -angle, 0]}
            >
                <boxGeometry args={[length, 2, 0.1]} />
                <meshStandardMaterial
                    color="#ef4444"
                    transparent
                    opacity={0.5}
                />
            </mesh>
        );
    }

    return <group>{walls}</group>;
}

function RoomFloor({ points }) {

    if (points.length < 3) return null;

    const shape = new THREE.Shape();

    shape.moveTo(
        points[0][0],
        points[0][1]
    );

    for (let i = 1; i < points.length; i++) {
        shape.lineTo(
            points[i][0],
            points[i][1]
        );
    }

    const geometry =
        new THREE.ShapeGeometry(shape);

    return (
        <mesh
            geometry={geometry}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.03, 0]}
        >
            <meshStandardMaterial
                color="#ef4444"
                transparent
                opacity={0.25}
            />
        </mesh>
    );
}

// ==========================
// Main Component
// ==========================
export default function SpatialView() {

    const [mode, setMode] = useState("view");
    const [restrictedRooms, setRestrictedRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState([]);
    const [gatePosition, setGatePosition] = useState(null);
    const [persons, setPersons] = useState([]);
    const [drawMode, setDrawMode] = useState(false);

    useEffect(() => {

        const fetchKeypoints = async () => {
            try {

                const res = await fetch(
                    "http://127.0.0.1:8001/keypoints"
                );

                const data = await res.json();

                if (Array.isArray(data)) {
                    setPersons(data);
                }

            } catch (err) {
                console.log("Keypoint fetch error:", err);
            }
        };

        fetchKeypoints();

        const poll = setInterval(fetchKeypoints, 100);

        return () => clearInterval(poll);

    }, []);

    const anyViolation = persons.some(
        p => p.violations && p.violations.length > 0
    );

    return (
        <div className="bg-[#0f1720] p-4 rounded-xl border border-gray-800">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">

                <h2 className="text-green-400 text-2xl font-semibold">
                    3D Spatial View
                </h2>

                <span
                    className={`px-4 py-2 rounded font-semibold ${anyViolation
                        ? "bg-red-600"
                        : "bg-green-600"
                        }`}
                >
                    {anyViolation
                        ? "VIOLATION DETECTED"
                        : "ALL CLEAR"}
                </span>

            </div>

            {/* Controls */}
            <div className="flex gap-3 mb-4">

                <button
                    onClick={() => {
                        setMode("view");
                        setDrawMode(false);
                    }}
                    className={`px-4 py-2 rounded-lg ${mode === "view"
                        ? "bg-green-600"
                        : "bg-slate-700"
                        }`}
                >
                    View
                </button>

                <button
                    onClick={() => {
                        setMode("draw");
                        setDrawMode(true);
                    }}
                    className={`px-4 py-2 rounded-lg ${mode === "draw"
                        ? "bg-red-600"
                        : "bg-slate-700"
                        }`}
                >
                    Draw Restricted Zone
                </button>

                <button
                    onClick={() => setMode("gate")}
                    className={`px-4 py-2 rounded-lg ${mode === "gate"
                        ? "bg-yellow-600"
                        : "bg-slate-700"
                        }`}
                >
                    Add Gate
                </button>

                <button
                    onClick={() => {
                        setCurrentRoom([]);
                        setRestrictedRooms([]);
                        setGatePosition(null);

                        setMode("view");
                        setDrawMode(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                    Reset
                </button>

                {
                    currentRoom.length >= 3 && (

                        <button
                            onClick={() => {

                                setRestrictedRooms(prev => [
                                    ...prev,
                                    currentRoom
                                ]);

                                setCurrentRoom([]);

                                setMode("view");
                                setDrawMode(false);

                            }}
                            className="px-4 py-2 bg-green-600 rounded-lg"
                        >
                            Save Room
                        </button>

                    )
                }

            </div>

            {/* 3D Scene */}
            <div className="h-[600px] rounded overflow-hidden">

                <Canvas
                    camera={{
                        position: [0, 6, 10],
                        fov: 50
                    }}
                >

                    {/* Lights */}
                    <ambientLight intensity={1.5} />

                    <directionalLight
                        position={[5, 8, 5]}
                        intensity={1}
                    />

                    {/* Grid */}
                    <Grid
                        args={[16, 16]}
                        cellSize={1}
                        sectionSize={4}
                        fadeDistance={30}
                    />

                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, 0.02, 0]}
                        onClick={(e) => {

                            console.log("CLICKED", e.point);
                            console.log("MODE:", mode);
                            console.log("POINT:", e.point);

                            if (mode === "draw") {

                                setCurrentRoom(prev => [
                                    ...prev,
                                    [e.point.x, e.point.z]
                                ]);

                            }

                            if (mode === "gate") {

                                setGatePosition([
                                    e.point.x,
                                    e.point.z
                                ]);

                            }

                        }}
                    >
                        <planeGeometry args={[12, 8]} />
                        <meshBasicMaterial
                            transparent
                            opacity={0}
                        />
                    </mesh>

                    {/* ========================= */}
                    {/* FACTORY FLOOR */}
                    {/* ========================= */}
                    <mesh
                        position={[0, 0.01, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                    >
                        <planeGeometry args={[12, 8]} />
                        <meshStandardMaterial
                            color="#22c55e"
                            transparent
                            opacity={0.5}
                        />
                    </mesh>

                    {/* ========================= */}
                    {/* FACTORY WALLS */}
                    {/* ========================= */}

                    {/* LEFT WALL */}
                    <mesh position={[-6, 1.5, 0]}>
                        <boxGeometry args={[0.2, 3, 8]} />
                        <meshStandardMaterial
                            color="#475569"
                            transparent
                            opacity={0.4}
                        />
                    </mesh>

                    {/* RIGHT WALL */}
                    <mesh position={[6, 1.5, 0]}>
                        <boxGeometry args={[0.2, 3, 8]} />
                        <meshStandardMaterial
                            color="#475569"
                            transparent
                            opacity={0.4}
                        />
                    </mesh>

                    {/* BACK WALL */}
                    <mesh position={[0, 1.5, -4]}>
                        <boxGeometry args={[12, 3, 0.2]} />
                        <meshStandardMaterial
                            color="#475569"
                            transparent
                            opacity={0.4}
                        />
                    </mesh>

                    {currentRoom.map((p, i) => (

                        <mesh
                            key={i}
                            position={[p[0], 0.05, p[1]]}
                        >
                            <sphereGeometry args={[0.12, 16, 16]} />
                            <meshStandardMaterial color="red" />
                        </mesh>

                    ))}

                    {/* Saved Rooms */}
                    {restrictedRooms.map((room, index) => (
                        <group key={index}>
                            <RoomFloor points={room} />
                            <RoomWalls points={room} />
                        </group>
                    ))}

                    {gatePosition && (
                        <mesh position={[gatePosition[0], 0.2, gatePosition[1]]}>
                            <boxGeometry args={[0.4, 0.4, 0.4]} />
                            <meshStandardMaterial color="yellow" />
                        </mesh>
                    )}

                    {/* Skeletons */}
                    {persons.map((person) => (
                        <PersonSkeleton
                            key={person.id}
                            person={person}
                        />
                    ))}

                    <OrbitControls
                        target={[0, 0, 0]}
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                    />

                </Canvas>

            </div>

            <div className="text-white">
                Current Points: {currentRoom.length}
            </div>

            {/* Footer */}
            <div className="mt-3 text-xs text-gray-500">
                {persons.length} person(s) detected · skeleton turns red on violation
            </div>

        </div>
    );
}