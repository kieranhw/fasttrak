import requests
import numpy as np
import matplotlib.pyplot as plt
import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def generate_grid_coordinates(lat_min, lat_max, lng_min, lng_max, num_points):
    lat_points = np.linspace(lat_min, lat_max, int(np.sqrt(num_points)))
    lng_points = np.linspace(lng_min, lng_max, int(np.sqrt(num_points)))
    return [(lat, lng) for lat in lat_points for lng in lng_points]

def reverse_geocode(coordinate):
    api_key = os.getenv("NEXT_PUBLIC_GOOGLE_MAPS_KEY")
    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={coordinate[0]},{coordinate[1]}&key={api_key}"
    response = requests.get(url)
    if response.status_code == 200:
        results = response.json().get('results')
        if results:
            return results[0].get('formatted_address')
    return None

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
    
def save_to_js(addresses, filename="lib/data/liverpool-addresses.js"):
    with open(filename, 'w') as file:
        file.write("export const addressData = ")
        json.dump(addresses, file, indent=4)


def main():
    # Define the area boundaries as a polygon
    bottom_left = (53.380735, -2.975980)
    bottom_right = (53.377826, -2.904514)
    top_right = (53.430518, -2.941668)
    top_left = (53.431006, -2.998300)
    
    # Number of points to generate, corresponds to the density of the grid
    num_points = 300
    
    
    # Grid coordinates 
    lat_min = min(bottom_left[0], bottom_right[0])
    lat_max = max(top_left[0], top_right[0])
    lng_min = min(bottom_left[1], top_left[1])
    lng_max = max(bottom_right[1], top_right[1])

    coordinates = generate_grid_coordinates(lat_min, lat_max, lng_min, lng_max, num_points)
    addresses = [reverse_geocode(coord) for coord in coordinates]
    
    visualize_coordinates(coordinates)

    # Processing the addresses
    for address in addresses:
        if address:
            address_data = []
            for coord in coordinates:
                address = reverse_geocode(coord)
                if address:
                    address_data.append({
                        "address": address,
                        "lat": coord[0],
                        "lng": coord[1]
                    })

            # Save to JS file
            save_to_js(address_data)


if __name__ == "__main__":
    main()
