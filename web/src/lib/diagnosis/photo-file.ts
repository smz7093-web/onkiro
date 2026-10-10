import { fitWithin, MAX_PHOTO_BYTES, MAX_PHOTO_EDGE } from "./photos";

// 사진 업로드 전 처리 (SIM-06, task.md 6.4): 브라우저에서 줄이고 위치정보(EXIF)를 지운다.
// 캔버스로 다시 그리면 원본 메타데이터가 빠지지만, 브라우저마다 다를 수 있어
// 마지막에 JPEG 메타데이터 구간을 한 번 더 걷어낸다(stripJpegMetadata).

// JPEG에서 APP1~APP15(EXIF·XMP 등)와 주석(COM) 구간을 뺀다. APP0(JFIF)과 영상 데이터는 그대로 둔다.
export function stripJpegMetadata(input: Uint8Array): Uint8Array {
  if (input[0] !== 0xff || input[1] !== 0xd8)
    throw new Error("JPEG 파일이 아닙니다");
  const out: number[] = [0xff, 0xd8];
  let i = 2;
  while (i < input.length) {
    if (input[i] !== 0xff) throw new Error("JPEG 구조를 읽을 수 없습니다");
    const marker = input[i + 1];
    // SOS(영상 데이터 시작) 이후는 끝까지 그대로 복사한다
    if (marker === 0xda) {
      for (let j = i; j < input.length; j++) out.push(input[j]);
      break;
    }
    // 길이가 없는 표식 (RSTn, EOI 등)
    if (
      marker === 0xd9 ||
      (marker >= 0xd0 && marker <= 0xd7) ||
      marker === 0x01
    ) {
      out.push(0xff, marker);
      i += 2;
      continue;
    }
    const length = (input[i + 2] << 8) | input[i + 3];
    const end = i + 2 + length;
    const isMetadata = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadata) for (let j = i; j < end; j++) out.push(input[j]);
    i = end;
  }
  return Uint8Array.from(out);
}

export interface PreparedPhoto {
  blob: Blob;
  width: number;
  height: number;
}

// 브라우저 전용. 회전 정보는 그림에 반영하고(from-image), 긴 변을 1600px 이하로 줄여 JPEG로 만든다.
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const { width, height } = fitWithin(
    bitmap.width,
    bitmap.height,
    MAX_PHOTO_EDGE,
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이 브라우저에서는 사진을 처리할 수 없습니다");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encoded = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("사진을 변환하지 못했습니다"))),
      "image/jpeg",
      0.85,
    ),
  );
  const clean = stripJpegMetadata(new Uint8Array(await encoded.arrayBuffer()));
  if (clean.byteLength > MAX_PHOTO_BYTES) throw new Error("사진이 너무 큽니다");
  return {
    blob: new Blob([clean as BlobPart], { type: "image/jpeg" }),
    width,
    height,
  };
}
