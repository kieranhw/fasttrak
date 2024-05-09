import matplotlib.pyplot as plt

# Data
days = [1, 2, 3, 4, 5, 6, 7]
packages_input = [300, 300, 300, 300, 300, 0, 0]
scheduled_standard = [0, 0, 155, 247, 187, 263, 223]
scheduled_express = [0, 0, 120, 26, 86, 10, 44]

# Plot
plt.figure(figsize=(10, 6))
plt.bar(days, packages_input, label='Packages Input', color='blue')
plt.bar(days, scheduled_standard, label='Scheduled Standard', color='orange', bottom=scheduled_express)
plt.bar(days, scheduled_express, label='Scheduled Express', color='green')

# Labels and title
plt.xlabel('Day')
plt.ylabel('Packages Scheduled')
plt.title('Packages Scheduled by Day')
plt.legend()

# Show plot
plt.xticks(days)
plt.tight_layout()
plt.show()
