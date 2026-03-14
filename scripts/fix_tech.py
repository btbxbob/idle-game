#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Fix technology.rs - change &'static str to String
with open('src/entities/technology.rs', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the struct definition
content = content.replace(
    'pub name: &\'static str,\n    /// Description (from id.description())\n    pub description: &\'static str,',
    'pub name: String,\n    /// Description (from id.description())\n    pub description: String,'
)

# Replace in new() function
content = content.replace(
    'name: id.name(),\n            description: id.description(),',
    'name: id.name().to_string(),\n            description: id.description().to_string(),'
)

with open('src/entities/technology.rs', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed technology.rs")

# Fix systems/technology.rs - add .to_string() to name fields
with open('src/systems/technology.rs', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace name: TechnologyId::...name() with .to_string()
content = content.replace('.name(),', '.name().to_string(),')

with open('src/systems/technology.rs', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed systems/technology.rs")
