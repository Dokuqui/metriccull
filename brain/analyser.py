import json
import sys
from google import genai
from google.genai import types


def analyze_with_gemini(data):
    metrics = data.get("metrics", {})
    bottlenecks = data.get("top_bottlenecks", [])

    ms = metrics.get("total_time_ms", 0)
    kb = metrics.get("peak_memory_kb", 0)

    hot_paths_text = ""
    if bottlenecks:
        for f in bottlenecks[:3]:
            hot_paths_text += (
                f"- Function '{f['n']}' took {f['t']:.4f}s at {f['f']}:{f['l']}\n"
            )
    else:
        hot_paths_text = "- No significant bottlenecks detected."

    prompt = f"""
    You are a Senior Python Performance Engineer. 
    Analyze the provided execution metrics and hot paths of a Python script.
    Provide exactly 3 highly technical, actionable suggestions to optimize the code.
    Keep suggestions concise (under 2 sentences each).
    Assign a grade: 'A' (Excellent), 'B' (Good but needs tweaks), 'C' (Poor), or 'F' (Critical).
    
    Execution Time: {ms} ms
    Peak Memory: {kb / 1024:.2f} MB
    Top Bottlenecks:
    {hot_paths_text}

    Respond ONLY with a valid JSON object using this exact structure:
    {{
      "score": "B",
      "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
    }}
    """

    try:
        client = genai.Client()

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        result = json.loads(response.text)
        return result

    except Exception as e:
        return {
            "score": "Err",
            "suggestions": [f"Gemini AI Analysis failed. Error: {str(e)}"],
        }


if __name__ == "__main__":
    input_data = sys.stdin.read()
    if input_data:
        try:
            report_data = json.loads(input_data)
            print(json.dumps(analyze_with_gemini(report_data)))
        except Exception:
            print(
                json.dumps(
                    {"score": "Err", "suggestions": ["Failed to parse input data."]}
                )
            )
