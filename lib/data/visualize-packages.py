import numpy as np
import matplotlib.pyplot as plt
import json
import re

def visualize_coordinates(coordinates):
    latitudes = [coord[0] for coord in coordinates]
    longitudes = [coord[1] for coord in coordinates]

    plt.figure(figsize=(10, 6))
    plt.scatter(longitudes, latitudes, color='blue', marker='o')
    plt.title('Grid Coordinates Visualization')
    plt.xlabel('Longitude')
    plt.ylabel('Latitude')
    plt.grid(True)
    plt.show()
    
def main():
    # Read the JavaScript file
    with open('lib/data/liverpool-addresses-even.js', 'r') as file:
        js_content = file.read()

    # Find the start and end of the JSON array
    start = js_content.find('[')
    end = js_content.rfind(']') + 1  # +1 to include the closing bracket

    # Check if a JSON array was found
    if start != -1 and end != -1:
        json_str = js_content[start:end]
        address_data = json.loads(json_str)
        visualize_coordinates([(data['lat'], data['lng']) for data in address_data])

    else:
        print("JSON data not found in the file.")

if __name__ == "__main__":
    main()
