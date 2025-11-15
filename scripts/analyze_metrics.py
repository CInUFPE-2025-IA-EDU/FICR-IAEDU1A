import json
from datetime import datetime
import pandas as pd

def generate_research_metrics():
    data = {
        "timestamp": datetime.now().isoformat(),
        "research_metrics": {},
        "squads": {}
    }

    data["research_metrics"] = {
        "total_students": 36,
        "total_squads": 9,
        "total_issues": 144,
        "experiment_duration_weeks": 4,
        "technologies": ["HTML5", "CSS3"],
        "variables": {
            "independent": "GitHub Copilot usage",
            "dependent": ["code_quality", "productivity", "engagement"]
        }
    }

    for squad in ["A", "B", "C", "D", "E", "F", "G", "H", "I"]:
        data["squads"][f"squad-{squad}"] = {
            "members": {
                "html": [],
                "css": []
            },
            "pages": {},
            "metrics": {
                "html_validation_errors": 0,
                "commits_count": 0,
                "completion_rate": 0
            },
            "experiment_group": "TODO"  # COMIA ou SEMIA
        }

    return data


def save_glmm_csv(data):
    rows = []
    for squad_name, squad_data in data["squads"].items():
        for page_name, page_data in squad_data.get("pages", {}).items():
            rows.append({
                "squad": squad_name,
                "student_id": "TODO",
                "page": page_name,
                "html_errors": page_data.get("html_errors", 0),
                "completion_time": page_data.get("completion_time", 0),
                "copilot_usage": squad_data.get("experiment_group", "control"),
                "sprint": page_data.get("sprint", 1)
            })

    df = pd.DataFrame(rows)
    df.to_csv("research_data_glmm.csv", index=False)
    return df


def main():
    data = generate_research_metrics()

    with open("research_metrics.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    df = save_glmm_csv(data)
    print(f"📊 Estrutura GLMM salva em research_data_glmm.csv ({len(df)} linhas)")


if __name__ == "__main__":
    main()
