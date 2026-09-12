#!/bin/bash
PLATFORM=$1
SESSION=$2
SCRIPTFILE=$3
START=$(date +%s)
webcmd --profile "$PLATFORM" --session "$SESSION" browser run --file "$SCRIPTFILE" > /tmp/run_out.json
END=$(date +%s)
echo "platform=$PLATFORM duration_s=$((END-START))"
python3 -c "import json; d=json.load(open('/tmp/run_out.json')); print(d.get('result'))"
