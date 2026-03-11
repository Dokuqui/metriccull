import pstats
import json


def convert_prof_to_json(prof_file):
    stats = pstats.Stats(prof_file)
    stats.sort_stats("cumulative")

    func_list = []
    for func, (cc, nc, tt, ct, callers) in stats.stats.items():
        func_list.append(
            {
                "n": func[2],
                "f": func[0],
                "l": func[1],
                "t": ct,
                "own": tt,
            }
        )

    print(json.dumps(func_list))


if __name__ == "__main__":
    convert_prof_to_json("profile_data.prof")
