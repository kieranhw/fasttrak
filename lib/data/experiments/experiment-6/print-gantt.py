# Importing the matplotlib.pyplot
import matplotlib.pyplot as plt
 
# Declaring a figure "gnt"
fig, gnt = plt.subplots()
 
# Setting Y-axis limits
gnt.set_ylim(0, 40)
 
# Setting X-axis limits
gnt.set_xlim(0, 7)
 
# Setting labels for x-axis and y-axis
gnt.set_xlabel('Days')
gnt.set_ylabel('Action')
 
# Setting ticks on y-axis
gnt.set_yticks([15, 25])
# Labelling tickes of y-axis
gnt.set_yticklabels(['Schedule', 'Input'])
 
# Setting vertical grid lines only
gnt.grid(axis='x')
gnt.set_title("Gantt Chart for Days Which Packages are Input and Scheduled")
 
# Declaring a bar in schedule
 
# Declaring multiple bars in at same level and same width
gnt.broken_barh([(2, 7)], (10, 9),
                         facecolors ='tab:blue')
 
gnt.broken_barh([(0, 5)], (20, 9),
                                  facecolors =('tab:red'))

plt.savefig("/Users/kieranhardwick/Documents/software-projects/fasttrak/lib/data/experiments/experiment-6/gantt-priority.png")
