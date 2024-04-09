import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import type { MRPRelay } from "./core/relay";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
    y?: number;
    x?: number;
    start?: number;
    duration?: number;
};

export const flyAndScale = (
    node: Element,
    params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
    const style = getComputedStyle(node);
    const transform = style.transform === "none" ? "" : style.transform;

    const scaleConversion = (
        valueA: number,
        scaleA: [number, number],
        scaleB: [number, number]
    ) => {
        const [minA, maxA] = scaleA;
        const [minB, maxB] = scaleB;

        const percentage = (valueA - minA) / (maxA - minA);
        const valueB = percentage * (maxB - minB) + minB;

        return valueB;
    };

    const styleToString = (
        style: Record<string, number | string | undefined>
    ): string => {
        return Object.keys(style).reduce((str, key) => {
            if (style[key] === undefined) return str;
            return str + `${key}:${style[key]};`;
        }, "");
    };

    return {
        duration: params.duration ?? 200,
        delay: 0,
        css: (t) => {
            const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
            const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
            const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);
            return styleToString({
                transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                opacity: t
            });
        },
        easing: cubicOut
    };
};

export const isOperator = async (relay: MRPRelay): Promise<boolean> => {
    const user = await window.nostr?.getPublicKey(),
          operator = await relay.owner?.pubkey
    console.log('isOperator', user, operator, user === operator)
    if(typeof user === 'undefined' || typeof operator === 'undefined') return false
    return (user === operator)
}

export const parseImages = (text: string): string => {
    const imageURLPattern = /https?:\/\/\S+\.(png|gif|jpg|jpeg|webp|svg|bmp)\b/gi;
    return text.replace(imageURLPattern, (match) => `<img src="${match}" alt="Image" />`);
}

export const parseMP4s = (text: string): string => {
    const mp4URLPattern = /https?:\/\/\S+\.mp4\b/gi;
    let videoHTML = '';
    const extractedUrls = [];

    // Extract URLs and generate video HTML tags for them.
    text = text.replace(mp4URLPattern, (match) => {
        extractedUrls.push(match);
        videoHTML += `<video controls src="${match}" type="video/mp4">Your browser does not support the video tag.</video><br>`;
        return ''; // Remove the URL from the original location.
    });

    // Prepend extracted video players to the top of the text.
    return videoHTML + text;
}

export const currentOriginMatchesRelayOrigin = (urlString: string): boolean => {
    try {
        const url = new URL(urlString);
        return url.origin === window.location.origin;
    } catch (e) {
        console.error("Invalid URL", e);
        return false;
    }
}

export const getRelativePath = (baseUrlString: string, targetUrlString: string): string | null => {
    try {
        const baseUrl = new URL(baseUrlString);
        const targetUrl = new URL(targetUrlString);
        
        if (baseUrl.origin !== targetUrl.origin) {
            console.error("URLs are from different origins.");
            return null;
        }

        const basePath = baseUrl.pathname;
        const targetPath = targetUrl.pathname;

        const relativePath = new URL(targetUrlString).pathname.replace(new URL(baseUrlString).pathname, "");
        return relativePath.startsWith('/') ? relativePath : '/' + relativePath;
    } catch (e) {
        console.error("Invalid URL", e);
        return null;
    }
}
