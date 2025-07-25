import os as _os
import csv as _csv

_PATH = "csv"
_KEYS = {
    "p1move": 0,
    "p1surrendered": 1,
    "p2move": 2,
    "p2surrendered": 3
}
_cached_csvs:dict[str, list[list[int|bool]]] = {}

for file_name in _os.listdir(_PATH):
    _cached_csvs[file_name] = []

    with open(_os.path.join(_PATH, file_name), mode="r", encoding="utf-8-sig", newline="") as file:
        csv_reader = _csv.reader(file)
        next(csv_reader)

        for row in csv_reader:
            if not len(row): continue

            _cached_csvs[file_name].append([
                int(row[1]),
                int(row[2]),
                int(row[3]),
                bool(row[4])
            ])

def get_value(csv_name:str, column_name:str, round_number:int) -> int|bool:
    cached_csv = _cached_csvs.get(csv_name)
    if cached_csv == None:
        raise ValueError(f"csv_name {csv_name} does not match any existing csv")
    
    column_index = _KEYS.get(column_name)
    if column_index == None:
        raise ValueError(f"column_name {column_name} does not match: {", ".join(_KEYS.keys())}")
    
    row_list = None
    try:
        row_list = cached_csv[round_number-1]
    except IndexError:
        raise ValueError(f"round_number {round_number} is out of range")
    
    return row_list[column_index]

def get_rounds_quantity(csv_name:str) -> int:
    cached_csv = _cached_csvs.get(csv_name)
    if cached_csv == None:
        raise ValueError(f"csv_name {csv_name} does not match any existing csv")
    
    return len(cached_csv)

def get_csv_names() -> list:
    return list(_cached_csvs.keys())