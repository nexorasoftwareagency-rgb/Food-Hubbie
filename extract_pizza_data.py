import json

# Define the source and destination file paths
source_file = r'c:\Users\DELL\Downloads\prashant-pizza-e86e4-default-rtdb-pizza-export.json'
output_file = r'd:\Foodhubbie\extracted_pizza_data.json'

def extract_data():
    try:
        with open(source_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Initialize the extracted data dictionary
        extracted = {}
        
        # 1. Extract Menu, Category, and Dishes (All requested catalog items)
        if 'Menu' in data:
            extracted['Menu'] = data['Menu']
        if 'categories' in data:
            extracted['categories'] = data['categories']
        if 'dishes' in data:
            extracted['dishes'] = data['dishes']
            
        # 2. Extract Rider Stats (since the main riders node is missing)
        if 'riderStats' in data:
            extracted['riderStats'] = data['riderStats']
            
        # 3. Add a placeholder or note about missing rider profiles if they aren't there
        if 'riders' in data:
            extracted['riders'] = data['riders']
        else:
            print("Warning: 'riders' node not found in the source JSON export.")
            
        # Save the extracted data to the output file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(extracted, f, indent=2)
            
        print(f"Successfully extracted data to {output_file}")
        print(f"Extracted keys: {list(extracted.keys())}")
        
    except Exception as e:
        print(f"Error during extraction: {str(e)}")

if __name__ == "__main__":
    extract_data()
