import { TOKENS, type IFfmpeg } from 'lossless-cut-application';
import pMap from 'p-map';
import { container } from 'tsyringe';

export async function renderThumbnails({ filePath, from, duration, onThumbnail, signal }: {
  filePath: string,
  from: number,
  duration: number,
  onThumbnail: (a: { time: number, url: string }) => void,
  signal: AbortSignal,
}) {
    const ffmpeg = container.resolve<IFfmpeg>(TOKENS.Ffmpeg);
  const numThumbs = 10;
  const thumbTimes = Array.from({ length: numThumbs }).fill(undefined).map((_unused, i) => (from + ((duration * i) / numThumbs)));
  // console.log(thumbTimes);

  await pMap(thumbTimes, async (time) => {
    const url = await ffmpeg.renderThumbnail(filePath, time, signal);
    onThumbnail({ time, url });
  }, { concurrency: 2 });
}