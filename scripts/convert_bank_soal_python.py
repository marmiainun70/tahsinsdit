from __future__ import annotations

import ast
import json
import tokenize
import uuid
from collections import Counter
from pathlib import Path


SOURCE_PATH = Path(
    r"C:\Users\ASUS\OneDrive\Desktop\SDIT LUQMANUL HAKIM\Tahfizh sdit luqman\Form Ujian\bank soal evaluasi tertulis guru tahfizh.py"
)
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "src" / "data"


def read_source(path: Path) -> str:
    with tokenize.open(path) as handle:
        return handle.read()


def resolve_constant(node: ast.AST, env: dict[str, object]) -> object:
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Name) and node.id in env:
        return env[node.id]
    if isinstance(node, ast.List):
        return [resolve_constant(elt, env) for elt in node.elts]
    if isinstance(node, ast.Tuple):
        return tuple(resolve_constant(elt, env) for elt in node.elts)
    if isinstance(node, ast.Dict):
        return {
            resolve_constant(key, env): resolve_constant(value, env)
            for key, value in zip(node.keys, node.values)
        }
    raise ValueError(f"Unsupported constant: {ast.dump(node, include_attributes=False)}")


def collect_environment(tree: ast.AST) -> dict[str, object]:
    env: dict[str, object] = {}
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            target = node.targets[0].id
            try:
                env[target] = resolve_constant(node.value, env)
            except ValueError:
                continue
    return env


def is_reflective(record: dict[str, object]) -> bool:
    tipe = str(record.get("tipe_soal", "")).strip().lower()
    pilihan = record.get("pilihan")
    has_complete_choices = isinstance(pilihan, dict) and all(
        str(pilihan.get(key, "")).strip() for key in ("A", "B", "C", "D")
    )
    return "reflektif" in tipe or "rubrik" in tipe or not has_complete_choices


def shuffle_answer_positions(record: dict[str, object], target_index: int) -> dict[str, object]:
    if is_reflective(record):
        return record

    pilihan = record["pilihan"]
    assert isinstance(pilihan, dict)

    current_key = str(record["jawaban_benar"]).strip().upper()
    target_key = ("A", "B", "C", "D")[target_index % 4]
    if current_key == target_key:
        return record

    pilihan[current_key], pilihan[target_key] = pilihan[target_key], pilihan[current_key]
    record["jawaban_benar"] = target_key
    return record


def build_pg_record(call: ast.Call, env: dict[str, object]) -> dict[str, object]:
    values = [resolve_constant(arg, env) for arg in call.args]
    if len(values) != 13:
        raise ValueError(f"Unexpected PG arg count: {len(values)}")

    kategori, sub_aspek, tipe_soal, level, sulit, soal, a, b, c, d, kunci, pembahasan, indikator = values
    return {
        "kategori": str(kategori).strip(),
        "sub_aspek": str(sub_aspek).strip(),
        "tipe_soal": str(tipe_soal).strip(),
        "level_kognitif": str(level).strip(),
        "tingkat_kesulitan": str(sulit).strip(),
        "indikator_kompetensi": str(indikator).strip(),
        "soal": str(soal).strip(),
        "pilihan": {"A": str(a).strip(), "B": str(b).strip(), "C": str(c).strip(), "D": str(d).strip()},
        "jawaban_benar": str(kunci).strip().upper(),
        "pembahasan": str(pembahasan).strip(),
        "bobot": 1,
        "aktif": True,
    }


def build_reflective_record(call: ast.Call, env: dict[str, object]) -> dict[str, object]:
    values = [resolve_constant(arg, env) for arg in call.args]
    if len(values) != 7:
        raise ValueError(f"Unexpected reflective arg count: {len(values)}")

    kategori, sub_aspek, level, sulit, soal, rubrik, indikator = values
    return {
        "kategori": str(kategori).strip(),
        "sub_aspek": str(sub_aspek).strip(),
        "tipe_soal": "Reflektif/Open-Ended",
        "level_kognitif": str(level).strip(),
        "tingkat_kesulitan": str(sulit).strip(),
        "indikator_kompetensi": str(indikator).strip(),
        "soal": str(soal).strip(),
        "pilihan": None,
        "jawaban_benar": "(Dinilai dengan rubrik)",
        "pembahasan": str(rubrik).strip(),
        "rubrik_penilaian": str(rubrik).strip(),
        "bobot": 1,
        "aktif": True,
    }


def main() -> None:
    source = read_source(SOURCE_PATH)
    tree = ast.parse(source)
    env = collect_environment(tree)

    pg_records: list[dict[str, object]] = []
    reflective_records: list[dict[str, object]] = []

    pg_count = 1
    reflective_count = 1

    for node in tree.body:
        if not isinstance(node, ast.Expr) or not isinstance(node.value, ast.Call):
            continue

        call = node.value
        if not isinstance(call.func, ast.Name):
            continue

        if call.func.id == "add":
            record = build_pg_record(call, env)
            record["id_soal"] = f"THS-{pg_count:04d}"
            record["uuid"] = str(uuid.uuid4())
            record["versi"] = "v2"
            if is_reflective(record):
                record["id_soal"] = f"THR-{reflective_count:04d}"
                record["versi"] = "v1"
                record["pilihan"] = None
                record["rubrik_penilaian"] = record["pembahasan"]
                reflective_records.append(record)
                reflective_count += 1
            else:
                pg_records.append(shuffle_answer_positions(record, len(pg_records)))
                pg_count += 1
        elif call.func.id == "add_reflektif":
            record = build_reflective_record(call, env)
            record["id_soal"] = f"THR-{reflective_count:04d}"
            record["uuid"] = str(uuid.uuid4())
            record["versi"] = "v1"
            reflective_records.append(record)
            reflective_count += 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "bank_soal_pg_v2.json").write_text(
        json.dumps(pg_records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (OUTPUT_DIR / "bank_soal_reflektif_v1.json").write_text(
        json.dumps(reflective_records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    answer_distribution = Counter(record["jawaban_benar"] for record in pg_records)
    print(f"PG: {len(pg_records)} soal")
    print(f"Reflektif: {len(reflective_records)} soal")
    print(f"Distribusi jawaban PG: {dict(answer_distribution)}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
