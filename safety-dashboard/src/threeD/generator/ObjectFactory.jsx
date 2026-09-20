import Machine from "../assets3D/models/Machine";
import Table from "../assets3D/models/Table";
import Rack from "../assets3D/models/Rack";
import Chair from "../assets3D/models/Chair";
import Door from "../assets3D/models/Door";
import Pillar from "../assets3D/models/Pillar";
import Conveyor from "../assets3D/models/Conveyor";

export default function ObjectFactory({
  type,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}) {
  switch (type.toLowerCase()) {
    case "machine":
      return (
        <Machine
          position={position}
          rotation={rotation}
          scale={scale}
        />
      );

    case "table":
      return (
        <Table
          position={position}
          rotation={rotation}
          scale={scale}
        />
      );

    case "rack":
      return (
        <Rack
          position={position}
          rotation={rotation}
          scale={scale}
        />
      );

    case "chair":
      return (
        <Chair
          position={position}
          rotation={rotation}
          scale={scale}
        />
      );

    case "door":
      return (
        <Door
          position={position}
          rotation={rotation}
          scale={scale}
        />
      );

    case "pillar":
      return (
        <Pillar
          position={position}
          rotation={rotation}
          scale={scale}
        />
      );

    case "conveyor":
      return (
        <Conveyor
          position={position}
          rotation={rotation}
          scale={scale}
        />
      );

    default:
      return null;
  }
}