import json

filepath = r'c:\Users\DELL\Downloads\prashant-pizza-e86e4-default-rtdb-pizza-export.json'
with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

def find_riders(obj, path=''):
    if isinstance(obj, dict):
        if 'name' in obj and 'email' in obj and 'customers' not in path and 'orders' not in path:
            print(f"Possible rider at {path}: {obj}")
        for k, v in obj.items():
            find_riders(v, f"{path}/{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            find_riders(v, f"{path}[{i}]")

find_riders(data)
