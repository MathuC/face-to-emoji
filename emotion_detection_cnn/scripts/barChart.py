import os
import matplotlib.pyplot as plt

# Get the current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# List to store directory names and file counts
directories = []
file_counts = []

# Iterate through directories in the current location
for entry in os.listdir(script_dir):
    full_path = os.path.join(script_dir, entry)
    if os.path.isdir(full_path):
        directories.append(entry)
        file_counts.append(len([f for f in os.listdir(full_path) if os.path.isfile(os.path.join(full_path, f))]))

# Create a bar chart
plt.figure(figsize=(10, 6))
bars = plt.bar(directories, file_counts, color='blue')

for bar in bars:
    height = bar.get_height()
    plt.text(
        bar.get_x() + bar.get_width() / 2,  # X-coordinate
        height,  # Y-coordinate
        str(height),  # Text to display (number of files)
        ha='center',  # Horizontal alignment
        va='bottom'   # Vertical alignment
    )

plt.xlabel('Emotions')
plt.ylabel('Number of Images')
plt.title('Number of Images for Each Emotion')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()

# Save the chart as an image or display it
plt.savefig('emotion_img_counts.png')  # Saves the chart as an image
plt.show()  # Displays the chart