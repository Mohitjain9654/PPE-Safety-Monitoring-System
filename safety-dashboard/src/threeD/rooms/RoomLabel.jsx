import { Text } from "@react-three/drei";

export default function RoomLabel({
  text,
  position,
}) {
  return (
    <Text
      position={position}
      fontSize={0.4}
      color="white"
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  );
}