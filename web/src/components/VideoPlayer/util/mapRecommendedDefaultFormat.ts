import type { FFprobeStream } from "lossless-cut-application";
import { pcmAudioCodecs } from "./streams";

export function mapRecommendedDefaultFormat({ streams, sourceFormat }: { streams: FFprobeStream[], sourceFormat: string | undefined }) {
  // Certain codecs cannot be muxed by ffmpeg into mp4, but in MOV they can
  // so we default to MOV instead in those cases https://github.com/mifi/lossless-cut/issues/948
  if (sourceFormat === 'mp4' && streams.some((stream) => pcmAudioCodecs.includes(stream.codec_name))) {
    return { format: 'mov', message: ('This file contains an audio track that FFmpeg is unable to mux into the MP4 format, so MOV has been auto-selected as the default output format.') };
  }

  return { format: sourceFormat };
}