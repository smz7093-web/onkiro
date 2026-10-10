import exifr from "exifr";
// @ts-expect-error piexifjs는 타입 정의가 없다 (테스트에서만 쓴다)
import piexif from "piexifjs";
import { describe, expect, it } from "vitest";
import { stripJpegMetadata } from "./photo-file";
import { fitWithin, missingPhotoParts } from "./photos";

// 1×1 JPEG
const TINY_JPEG =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

// 홍성군 근처 GPS 좌표를 넣은 JPEG (휴대폰 사진과 같은 상황)
function jpegWithGps(): Uint8Array {
  const gps = {
    [piexif.GPSIFD.GPSLatitudeRef]: "N",
    [piexif.GPSIFD.GPSLatitude]: [
      [36, 1],
      [36, 1],
      [0, 1],
    ],
    [piexif.GPSIFD.GPSLongitudeRef]: "E",
    [piexif.GPSIFD.GPSLongitude]: [
      [126, 1],
      [39, 1],
      [0, 1],
    ],
  };
  const exif = piexif.dump({ "0th": {}, Exif: {}, GPS: gps });
  const binary: string = piexif.insert(exif, atob(TINY_JPEG));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

describe("사진 위치정보 제거 (SIM-06, task.md 6.4 완료 기준)", () => {
  it("GPS가 든 사진에서 위치정보가 사라진다", async () => {
    const original = jpegWithGps();
    const before = await exifr.gps(original);
    expect(before?.latitude).toBeCloseTo(36.6, 1);

    const cleaned = stripJpegMetadata(original);
    expect(await exifr.gps(cleaned)).toBeUndefined();
    expect(await exifr.parse(cleaned)).toBeUndefined();
  });

  it("메타데이터가 없는 사진은 그대로다", () => {
    const plain = Uint8Array.from(atob(TINY_JPEG), (c) => c.charCodeAt(0));
    expect(stripJpegMetadata(plain)).toEqual(plain);
  });

  it("JPEG가 아니면 거부한다", () => {
    expect(() =>
      stripJpegMetadata(Uint8Array.from([0x89, 0x50, 0x4e, 0x47])),
    ).toThrow();
  });
});

describe("사진 크기·누락 부위", () => {
  it("긴 변을 1600px로 줄이고 작은 사진은 키우지 않는다", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("사진이 없는 부위 수를 센다 (같은 부위 여러 장은 한 번)", () => {
    expect(missingPhotoParts([])).toBe(8);
    expect(missingPhotoParts(["front", "front", "roof"])).toBe(6);
  });
});
