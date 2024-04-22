import NDK from "@nostr-dev-kit/ndk";
import { marked } from "marked";
import * as DOMPurify from 'dompurify';

interface ParseConfig {
  removeHashtags?: boolean,
  nip19?: boolean,
  markdown?: boolean,
  markdownOptions?: marked.MarkedOptions,
  images?: boolean,
  videos?: boolean,
  truncate?: boolean,
  truncateLength?: number,
  sanitize?: boolean, 
}

const defaultConfig: ParseConfig = {
  removeHashtags: true,
  nip19: true,
  markdown: true,
  markdownOptions: { breaks: true },
  images: true,
  videos: true,
  truncate: false,
  truncateLength: 50,
  sanitize: false,
}


export const parseNote = async (text: string, config: ParseConfig): Promise<string> => {
  config = {...defaultConfig, ...config}

  if(config?.images)
    text = parseImages(text);

  if(config?.videos)
    text = parseMP4s(text);
  
  if(config?.nip19) 
    text = parseNip19(text);

  if(config?.truncate)
    text = truncate(text, config?.truncateLength);

  if(config?.markdown)
    text = await marked(text, config?.markdownOptions)

  if(config?.sanitize)
    text = DOMPurify.sanitize(text);

  if(config?.removeHashtags)
    text = removeHashtags(text);

  text = text.replace('&;', "'")
  
  return text
}

export const removeHashtags = (input: string): string => {
  const hashtagRegex = /#[\w\-]+/g;
  return input.replace(hashtagRegex, '');
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

export const parseNip19 = (text: string): string => {
  const encoded = /(nevent:|nprofile:|naddr:|nrelay:)\b/gi;
  return text.replace(encoded, (match: string): string  => {  
    if(match.startsWith('nevent'))
      return parseNEvent(match);
    if(match.startsWith('nprofile'))
      return parseNProfile(match);
    if(match.startsWith('naddr'))
      return parseNAddr(match);
    if(match.startsWith('nrelay'))
      return parseNRelay(match);
    return match
  });
}

export const parseNEvent = (encoded: string): string => {
  return encoded
}

export const parseNProfile = (encoded: string): string => {
  return encoded
}

export const parseNAddr = (encoded: string): string => {
  return encoded
}

export const parseNRelay = (encoded: string): string => {
  return encoded
}

export const truncate = (str, max = 10) => {
  const array = str.trim().split(' ');
  const ellipsis = array.length > max ? '...' : '';
  return array.slice(0, max).join(' ') + ellipsis;
};