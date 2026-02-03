import json
import sys


def analyze_performance(data):
    peak_mem = data.get("peak_memory_kb", 0)

    report = {
        "status": "success",
        "suggestion": "Memory usage is fine."
        if peak_mem < 50000
        else "High memory usage detected!",
    }
    return report


if __name__ == "__main__":
    raw_input = sys.stdin.read()
    data = json.loads(raw_input)
    print(json.dumps(analyze_performance(data)))
