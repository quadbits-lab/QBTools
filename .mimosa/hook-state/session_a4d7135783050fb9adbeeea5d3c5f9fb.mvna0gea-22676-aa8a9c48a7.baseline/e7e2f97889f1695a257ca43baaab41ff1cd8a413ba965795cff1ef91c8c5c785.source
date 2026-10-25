#!/usr/bin/env sh
# Optional: regenerate the checked-in, one-second synthetic browser fixtures with FFmpeg.
set -eu
ffmpeg -hide_banner -loglevel error -f lavfi -i 'testsrc2=size=160x90:rate=12' -f lavfi -i 'sine=frequency=440:sample_rate=44100' -t 1 -c:v libx264 -pix_fmt yuv420p -c:a aac -ac 2 -shortest -y tests/fixtures/clip.mp4
ffmpeg -hide_banner -loglevel error -i tests/fixtures/clip.mp4 -an -c:v copy -y tests/fixtures/silent.mp4
ffmpeg -hide_banner -loglevel error -f lavfi -i 'sine=frequency=440:sample_rate=44100' -t 1 -ac 2 -c:a pcm_s16le -y tests/fixtures/tone.wav
