import os
import json
import subprocess
import sys
from datetime import datetime

def analyze_page(squad_path, html_file):
    metrics = {
        "html_errors": 0,
        "html_warnings": 0,
        "file_size_html": 0,
    }

    html_path = os.path.join(squad_path, html_file)
    if os.path.exists(html_path):
        metrics["file_size_html"] = os.path.getsize(html_path)
        cmd = f"html-validate {html_path} --format json"
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                try:
                    issues = json.loads(result.stdout)
                    # html-validate geralmente retorna lista de erros
                    if isinstance(issues, list):
                        for issue in issues:
                            sev = issue.get("severity", 0)
                            if sev == 2:
                                metrics["html_errors"] += 1
                            elif sev == 1:
                                metrics["html_warnings"] += 1
                except json.JSONDecodeError:
                    pass
            else:
                if result.stderr:
                    print(f"[WARN] Erro ao validar {html_path}: {result.stderr}")
        except Exception as e:
            print(f"[EXCEPTION] Falha ao rodar html-validate: {e}")

    return metrics


def analyze_squad(squad_path):
    data = {
        "squad": os.path.basename(squad_path),
        "timestamp": datetime.now().isoformat(),
        "pages": {}
    }

    if not os.path.isdir(squad_path):
        print(f"[WARN] Pasta não encontrada: {squad_path}")
        return data

    for f in os.listdir(squad_path):
        if f.endswith(".html"):
            page_name = f.replace(".html", "")
            data["pages"][page_name] = analyze_page(squad_path, f)

    return data


def main():
    if len(sys.argv) != 2:
        print("Uso: python scripts/analyze_squad.py squads/squad-X")
        sys.exit(1)

    squad_path = sys.argv[1]
    metrics = analyze_squad(squad_path)

    squad_name = os.path.basename(squad_path)
    out_file = f"metrics-{squad_name}.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)

    print(f"📊 Métricas salvas em {out_file}")


if __name__ == "__main__":
    main()
