#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('src/core/idle_game.rs', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
content = content.replace(
    'use crate::entities::{Building, Housing, Upgrade, Worker};',
    'use crate::entities::{Building, Housing, Upgrade, Worker};\nuse crate::systems::technology::TechnologyTree;'
)

# 2. Add to IdleGame struct
content = content.replace(
    'statistics: Rc<RefCell<Statistics>>,\n}',
    'statistics: Rc<RefCell<Statistics>>,\n    #[wasm_bindgen(skip)]\n    technology_tree: TechnologyTree,\n}'
)

# 3. Add to SavedGame struct  
content = content.replace(
    'pub unlocked_features: Vec<UnlockedFeature>,\n    pub save_timestamp: f64,',
    'pub unlocked_features: Vec<UnlockedFeature>,\n    pub technology_tree: TechnologyTree,\n    pub save_timestamp: f64,'
)

# 4. Update save_game
content = content.replace(
    'unlocked_features: self.unlocked_features.clone(),\n            save_timestamp: Date::now(),',
    'unlocked_features: self.unlocked_features.clone(),\n            technology_tree: self.technology_tree.clone(),\n            save_timestamp: Date::now(),'
)

# 5. Update load_game
content = content.replace(
    'self.unlocked_features = saved.unlocked_features;\n    }\n}\n\n#[wasm_bindgen]',
    'self.unlocked_features = saved.unloaded_features;\n        self.technology_tree = saved.technology_tree;\n    }\n}\n\n#[wasm_bindgen]'
)

# 6. Add to new()
content = content.replace(
    'unlocked_features: vec![\n                UnlockedFeature {',
    'technology_tree: TechnologyTree::new(),\n            unlocked_features: vec![\n                UnlockedFeature {'
)

with open('src/core/idle_game.rs', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
