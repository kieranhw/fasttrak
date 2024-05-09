import seaborn as sns
import matplotlib.pyplot as plt
import csv
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

# Update the file path to your local path
file_path = '/Users/kieranhardwick/Documents/software-projects/fasttrak/lib/data/experiments/experiment-4/results-even.csv'

# Load data from the CSV file
data = []
with open(file_path, mode='r') as file:
    reader = csv.DictReader(file)
    for row in reader:
        # Calculate the sum of all four efficiency metrics
        efficiency = sum(float(row[key]) for key in ['te', 'de', 'wu', 'vu'])
        # Add this information to the data list
        if row['alg'] != 'RR':
            data.append({'Algorithm': row['alg'], 'Efficiency': efficiency})

# Create a DataFrame from the data
df = pd.DataFrame(data)

# Create a seaborn boxplot
plt.figure(figsize=(8, 6))
sns.boxplot(x='Algorithm', y='Efficiency', data=df, palette='Set2',showfliers=False)

# Add labels and title
plt.xlabel("Algorithm")
plt.ylabel("Efficiency")
plt.yticks(range(250, 281, 5), fontsize=10)

plt.title("Efficiency Ranges for Each Algorithm Over Five Runs - Evenly Distributed Dataset")

# Show the grid and plot
plt.grid(True, linestyle='--', linewidth=0.5)
plt.show()
