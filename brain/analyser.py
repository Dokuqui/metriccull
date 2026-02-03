import json
import sys


def analyze(data):
    ms = data.get("total_time_ms", 0)
    kb = data.get("peak_memory_kb", 0)

    insights = []
    if ms > 1000:
        insights.append("Execution took over 1 second. Consider optimizing loops.")
    if kb > 100000:
        insights.append("High memory footprint detected (>100MB).")

    return {
        "score": "B" if insights else "A",
        "suggestions": insights if insights else ["Code looks optimal!"],
    }


if __name__ == "__main__":
    line = sys.stdin.read()
    if line:
        report_data = json.loads(line)
        print(json.dumps(analyze(report_data)))
