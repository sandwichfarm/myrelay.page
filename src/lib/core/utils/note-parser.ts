import NDK from "@nostr-dev-kit/ndk";

export const parseNote = (text: string, ndk?: NDK): string => {
  text = parseImages(text);
  text = parseMP4s(text);
  if(ndk) 
    text = parseNip19(text, ndk);
  return text;
}

export const parseNip19 = (text: string, ndk: NDK): string => {
  const encoded = /(nevent:|nprofile:|naddr:|nrelay:)\b/gi;
  return text.replace(encoded, (match: string): string  => {  
    if(match.startsWith('nevent'))
      return parseNEvent(match, ndk);
    if(match.startsWith('nprofile'))
      return parseNProfile(match, ndk);
    if(match.startsWith('naddr'))
      return parseNAddr(match, ndk);
    if(match.startsWith('nrelay'))
      return parseNRelay(match, ndk);
    return match
  });
}

export const parseNEvent = (encoded: string, ndk: NDK): string => {
  return encoded
}

export const parseNProfile = (encoded: string, ndk: NDK): string => {
  return encoded
}

export const parseNAddr = (texencodedt: string, ndk: NDK): string => {
  return encoded
}

export const parseNRelay = (encoded: string, ndk: NDK): string => {
  return encoded
}


export const parseImages = (text: string): string => {
  const imageURLPattern = /https?:\/\/\S+\.(png|gif|jpg|jpeg|webp|svg|bmp)\b/gi;
  return text.replace(imageURLPattern, (match) => `<img src="${match}" alt="Image" />`);
}

export const parseMP4s = (text: string): string => {
  const mp4URLPattern = /https?:\/\/\S+\.mp4\b/gi;
  let videoHTML = '';
  const extractedUrls: string[] = [];

  text = text.replace(mp4URLPattern, (match: string) => {
      extractedUrls.push(match);
      videoHTML += `<video controls src="${match}" type="video/mp4">Your browser does not support the video tag.</video><br>`;
      return '';
  });

  return videoHTML + text;
}