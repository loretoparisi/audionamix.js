#!/bin/bash

INPUT=$1
OUT=$2
echo "Processing $INPUT..."
ffmpeg -i $INPUT -ar 44100 -ac 2 $OUT
