#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file
with open('src/systems/technology.rs', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the right places to edit
new_lines = []
for i, line in enumerate(lines):
    # Add serde import after first use statement
    if i == 0:
        new_lines.append(line)
        new_lines.append('use serde::{Deserialize, Serialize};\n')
    # Add derive before struct
    elif 'pub struct TechnologyTree {' in line:
        new_lines.append('#[derive(Serialize, Deserialize, Clone)]\n')
        new_lines.append(line)
    else:
        new_lines.append(line)

# Write back
with open('src/systems/technology.rs', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Updated systems/technology.rs")
