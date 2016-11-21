import csv
import json
import sys

pitch_annotation = json.loads(json.load(sys.stdin)['pitch_annotation'])

w = csv.writer(sys.stdout)
for segment in pitch_annotation:
    w.writerows(segment)
