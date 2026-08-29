import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'tests', 'fixtures');
mkdirSync(OUT, { recursive: true });

const SILENCE = ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '1'];

const audio = [
  ['sample.mp3', ['-c:a', 'libmp3lame', '-q:a', '9']],
  ['sample.flac', ['-c:a', 'flac', '-compression_level', '0']],
  ['sample.m4a', ['-c:a', 'aac', '-b:a', '32k']],
  ['sample.ogg', ['-c:a', 'libvorbis', '-q:a', '0']],
  ['sample.opus', ['-c:a', 'libopus', '-b:a', '32k']],
  ['sample.wav', ['-c:a', 'pcm_s16le']],
];

// ハイレゾ判定の検証用（24bit / 96kHz）
const HIRES = ['-f', 'lavfi', '-i', 'anullsrc=r=96000:cl=stereo', '-t', '1'];
audio.push(['sample-hires.flac', ['-c:a', 'flac', '-sample_fmt', 's32', '-compression_level', '0']]);

for (const [name, codec] of audio) {
  const source = name.includes('hires') ? HIRES : SILENCE;
  execFileSync('ffmpeg', ['-y', ...source, ...codec, join(OUT, name)], { stdio: 'inherit' });
}

for (const name of ['cover.png', 'cover.webp']) {
  execFileSync(
    'ffmpeg',
    ['-y', '-f', 'lavfi', '-i', 'color=c=red:s=64x64', '-frames:v', '1', join(OUT, name)],
    { stdio: 'inherit' },
  );
}

console.log('fixtures written to', OUT);
