import matplotlib.pyplot as plt
import csv

# Initialize empty lists for the data
generations = []
fitness = []

# Read the CSV file
with open('/Users/kieranhardwick/Documents/software-projects/fasttrak/lib/data/experiments/experiment-2/big-rr-fitness.csv', mode='r') as file:
    reader = csv.reader(file)
    next(reader)  # Skip the header if it exists

    # Populate the data lists
    for row in reader:
        generations.append(int(row[0]))  # First column is 'Generation'
        fitness.append(float(row[1]))    # Second column is 'Fitness'

# Plot
plt.figure(figsize=(10, 6))
plt.plot(generations, fitness, marker='', linestyle='-', linewidth=1)  # Line graph with thinner line

# Labels and Title
plt.xlabel("Generation", fontsize=12)
plt.ylabel("Fitness", fontsize=12)
plt.title("Fitness Improvement Over Generations: KM-GA", fontsize=14)

# X and Y axis adjustments
plt.xlim(0, 1500000)
plt.ylim(1250, 1500) 
plt.xticks(range(0, 1500001, 500000), fontsize=10)
plt.yticks(range(1250, 1500, 50), fontsize=10)

# Grid and Academic Style Adjustments
plt.grid(True, linestyle='--', linewidth=0.5)
plt.tight_layout()
plt.show()
