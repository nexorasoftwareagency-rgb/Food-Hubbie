import json
import sys

def extract():
    input_file = r'c:\Users\DELL\Downloads\prashant-pizza-e86e4-default-rtdb-pizza-export.json'
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    result = {}

    # Extract Menu (Categories and Items)
    if 'Menu' in data:
        result['Menu'] = data['Menu']
    elif 'categories' in data:
        result['categories'] = data['categories']
    
    if 'dishes' in data:
        result['dishes'] = data['dishes']
    
    if 'catalog' in data:
        result['catalog'] = data['catalog']

    # Extract Rider Profiles
    riders = {}
    if 'botUsers' in data:
        for uid, user in data['botUsers'].items():
            if user.get('role') == 'rider':
                riders[uid] = user
            elif 'rider' in user.get('name', '').lower():
                riders[uid] = user
    
    if 'riders' in data:
        result['riders'] = data['riders']
    
    if riders:
        result['riderProfiles'] = riders

    # Output to a file
    with open('extracted_pizza_data.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)
    
    print("Extraction complete. Saved to extracted_pizza_data.json")

if __name__ == "__main__":
    extract()
