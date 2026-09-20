export function map2Dto3D(
  pixelX,
  pixelY,
  frameWidth,
  frameHeight,
  roomWidth,
  roomLength
) {
  const x = (pixelX / frameWidth) * roomWidth - roomWidth / 2;

  const z =
    (pixelY / frameHeight) * roomLength -
    roomLength / 2;

  return { x, z };
}