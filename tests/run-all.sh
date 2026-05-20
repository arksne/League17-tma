#!/bin/bash
# Run all game tests sequentially
# Usage: bash tests/run-all.sh

REPORT="tests/full-report.txt"
> "$REPORT"

echo "===== RUNNING ALL TESTS =====" | tee -a "$REPORT"
echo "Started: $(date)" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"
FAILED=0

run_test() {
  local name="$1"
  local cmd="$2"
  echo "--- $name ---" | tee -a "$REPORT"
  local tmp="tests/.${name//\//_}.tmp"
  if eval "$cmd" > "$tmp" 2>&1; then
    tail -3 "$tmp" | tee -a "$REPORT"
    echo "PASS" | tee -a "$REPORT"
  else
    cat "$tmp" | tee -a "$REPORT"
    echo "FAIL" | tee -a "$REPORT"
    FAILED=1
  fi
  rm -f "$tmp"
}

run_test "Data Validation" "node tests/data-validation.mjs"
run_test "Server API" "node tests/server-api-test.cjs"
run_test "Save Validation" "node tests/save-validation-test.cjs"
run_test "Game Logic" "node tests/game-logic-test.cjs"
run_test "Move System" "node tests/move-system-test.cjs"
run_test "Gym Leaders" "node tests/gym-leader-test.cjs"
run_test "Item System" "node tests/item-system-test.cjs"
run_test "Breeding" "node tests/breeding-test.cjs"
run_test "Stress Test" "node tests/stress-test.cjs"

echo "" | tee -a "$REPORT"
echo "===== DONE =====" | tee -a "$REPORT"
echo "Finished: $(date)" | tee -a "$REPORT"
if [ "$FAILED" -ne 0 ]; then
  echo "SOME TESTS FAILED" | tee -a "$REPORT"
  exit 1
else
  echo "ALL TESTS PASSED" | tee -a "$REPORT"
fi
