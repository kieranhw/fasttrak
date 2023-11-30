import requests
import numpy as np
import matplotlib.pyplot as plt
import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def generate_even_coordinates(lat_min, lat_max, lng_min, lng_max, num_points):
    lat_points = np.linspace(lat_min, lat_max, int(np.sqrt(num_points)))
    lng_points = np.linspace(lng_min, lng_max, int(np.sqrt(num_points)))
    return [(lat, lng) for lat in lat_points for lng in lng_points]

def generate_random_coordinates(lat_min, lat_max, lng_min, lng_max, num_points):
    coordinates = []
    for _ in range(num_points):
        lat = np.random.uniform(lat_min, lat_max)
        lng = np.random.uniform(lng_min, lng_max)
        coordinates.append((lat, lng))
    return coordinates

def reverse_geocode(coordinate, attempt=0, max_attempts=3):
    api_key = os.getenv("NEXT_PUBLIC_GOOGLE_MAPS_KEY")

    # Adjust coordinates slightly if not first attempt
    lat_adj = np.random.uniform(-0.0005, 0.0005) if attempt > 0 else 0
    lng_adj = np.random.uniform(-0.0005, 0.0005) if attempt > 0 else 0
    adjusted_coordinate = (coordinate[0] + lat_adj, coordinate[1] + lng_adj)

    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={adjusted_coordinate[0]},{adjusted_coordinate[1]}&key={api_key}"
    response = requests.get(url)

    if response.status_code == 200:
        results = response.json().get('results')
        if results:
            for result in results:
                if "street_address" in result.get('types', []):
                    # Extract the location from the response
                    location = result.get('geometry', {}).get('location', {})
                    return result.get('formatted_address'), (location.get('lat'), location.get('lng'))

    # Retry with a nearby coordinate if max attempts not reached
    if attempt < max_attempts:
        return reverse_geocode(coordinate, attempt + 1, max_attempts)

    return None, None

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
    
def save_to_js(addresses, filename):
    with open(filename, 'w') as file:
        file.write("export const addressData = ")
        json.dump(addresses, file, indent=4)

def main():
    # Define the area boundaries as a polygon
    bottom_left = (53.378064, -2.966178)
    bottom_right = (53.382797, -2.908117)
    top_right = (53.421585, -2.947838)
    top_left = (53.412230, -2.996143)

    # Number of points to generate, corresponds to the density of the grid
    num_points = 150

    # Grid coordinates
    lat_min = min(bottom_left[0], bottom_right[0])
    lat_max = max(top_left[0], top_right[0])
    lng_min = min(bottom_left[1], top_left[1])
    lng_max = max(bottom_right[1], top_right[1])

    # Generate coordinates for each distribution type
    even = generate_even_coordinates(lat_min, lat_max, lng_min, lng_max, num_points)
    random = generate_random_coordinates(lat_min, lat_max, lng_min, lng_max, num_points)

    for dataset, dataset_name in [(even, 'even'), (random, 'random')]:
        address_data = []
        for coord in dataset:
            address, address_coord = reverse_geocode(coord)
            if address and address_coord:
                # Use the coordinates from the address response
                address_data.append({
                    "address": address,
                    "lat": address_coord[0],
                    "lng": address_coord[1]
                })

        # Correct the list comprehension for visualizing coordinates
        visualize_coordinates([(data['lat'], data['lng']) for data in address_data])

        # Save to JS file
        save_to_js(address_data, f"lib/data/liverpool-addresses-{dataset_name}.js")

if __name__ == "__main__":
    main()
