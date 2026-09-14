import * as FileSystem from "expo-file-system/legacy";
import { sha256Bytes } from "./sha256";

export async function sha256File(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return sha256Bytes(decodeBase64(base64));
}

function decodeBase64(value: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = value.replace(/[^A-Za-z0-9+/]/g, "");
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  const output = new Uint8Array((clean.length * 3) / 4 - padding);
  let buffer = 0;
  let bits = 0;
  let index = 0;

  for (const char of clean) {
    const mapped = chars.indexOf(char);
    if (mapped < 0) {
      continue;
    }
    buffer = (buffer << 6) | mapped;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      if (index < output.length) {
        output[index] = (buffer >> bits) & 0xff;
        index += 1;
      }
    }
  }

  return output;
}
