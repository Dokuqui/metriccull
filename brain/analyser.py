import json
import sys


def analyze(data):
    metrics = data.get("metrics", {})
    bottlenecks = data.get("top_bottlenecks", [])

    ms = metrics.get("total_time_ms", 0)
    kb = metrics.get("peak_memory_kb", 0)

    insights = []

    if bottlenecks:
        top_func = sorted(bottlenecks, key=lambda x: x["t"], reverse=True)[0]

        total_s = ms / 1000
        if total_s > 0 and (top_func["t"] / total_s) > 0.5:
            insights.append(
                f"Bottleneck detected in '{top_func['n']}' ({top_func['t']:.2f}s). Focus optimization here."
            )

    if ms > 1000:
        insights.append(
            "Execution took over 1 second. Consider profile-guided optimization."
        )
    if kb > 100000:
        insights.append(
            "High memory footprint detected (>100MB). Check for memory leaks or large data structures."
        )

    score = "A"
    if len(insights) == 1:
        score = "B"
    if len(insights) >= 2:
        score = "C"

    return {
        "score": score,
        "suggestions": insights
        if insights
        else ["Code looks optimal! No significant bottlenecks found."],
    }


if __name__ == "__main__":
    input_data = sys.stdin.read()
    if input_data:
        try:
            report_data = json.loads(input_data)
            result = analyze(report_data)
            print(json.dumps(result))
        except Exception as e:
            print(
                json.dumps(
                    {"score": "N/A", "suggestions": [f"Error in analysis: {str(e)}"]}
                )
            )
