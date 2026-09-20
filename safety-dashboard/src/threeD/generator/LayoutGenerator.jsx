import ObjectFactory from "./ObjectFactory";

export default function LayoutGenerator({
  objects = [],
}) {
  return (
    <>
      {objects.map((object, index) => (
        <ObjectFactory
          key={index}
          type={object.type}
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
        />
      ))}
    </>
  );
}