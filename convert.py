import pandas as pd
import json
from itertools import combinations

# Load the CSV file
df = pd.read_csv('data_scopus.csv')

# Data preparation: filtering out rows with missing values in 'Year', 'Authors', or 'Authors with affiliations'
df = df.dropna(subset=['Year', 'Authors', 'Authors with affiliations'])

# Step 1: Create nodes for each author and links based on shared publications
nodes = {}
links = []

# Process each row to create nodes and links
for _, row in df.iterrows():
    authors = row['Authors'].split(", ")
    publication_id = row['EID']
    
    # Filter out rows with missing affiliations or empty author names
    valid_authors = []
    for author, affiliation in zip(authors, row['Authors with affiliations'].split("; ")):
        if author and affiliation:  # Ensure both author name and affiliation are not empty
            valid_authors.append((author, affiliation))
    
    # Only proceed if we have valid authors with affiliation
    if len(valid_authors) > 1:
        for author, affiliation in valid_authors:
            # Create a node for each author if it doesn't already exist
            if author not in nodes:
                nodes[author] = {
                    "id": author,
                    "affiliation": affiliation,
                    "degree": 0
                }
    
        # Create links for each pair of valid authors for a publication
        for (author1, _), (author2, _) in combinations(valid_authors, 2):
            links.append({"source": author1, "target": author2, "publication": publication_id})

# Calculate degrees for each author based on links
for link in links:
    nodes[link["source"]]["degree"] += 1
    nodes[link["target"]]["degree"] += 1

# Step 2: Format data into JSON for D3
data = {
    "nodes": list(nodes.values()),
    "links": links
}

# Save the result to a JSON file
with open('author_network.json', 'w') as f:
    json.dump(data, f, indent=2)

print("JSON file 'author_network.json' created successfully.")
