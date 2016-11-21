import json
import sys

consonants_activity = json.loads(json.load(sys.stdin)['consonants_activity'])

it = iter(consonants_activity)
for x in it:
    print '{}\t{}\tconsonant'.format(x, next(it))
