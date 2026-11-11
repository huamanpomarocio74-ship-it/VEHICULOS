#!/usr/bin/env bash
# Uso: ./preparar_videos.sh mi_video.mp4 nube
# Genera assets/video/nube.mp4 (960x720, 4:3) y nube_card.mp4 (480x480), sin audio.
set -e
in="$1"; name="$2"
enc(){ ffmpeg -v error -y -i "$in" -an -vf "$1" -c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p -movflags +faststart "$2"; }
enc "crop=ih*4/3:ih,scale=960:720" "assets/video/$name.mp4"
enc "crop=ih:ih,scale=480:480" "assets/video/${name}_card.mp4"
