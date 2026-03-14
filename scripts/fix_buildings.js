const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/systems/production.rs', 'utf8');

// Define the new create_test_buildings function
const newFunction = `    fn create_test_buildings() -> Vec<Building> {
        vec![
            Building {
                name: "金币矿山".to_string(),
                cost: HashMap::from([(ResourceType::Gold, 15.0)]),
                production_rate: 1.0,
                count: 0,
                output_resource: ResourceType::Gold,
            },
            Building {
                name: "伐木场".to_string(),
                cost: HashMap::from([(ResourceType::Gold, 20.0)]),
                production_rate: 1.0,
                count: 0,
                output_resource: ResourceType::Wood,
            },
            Building {
                name: "采石场".to_string(),
                cost: HashMap::from([(ResourceType::Gold, 25.0)]),
                production_rate: 0.5,
                count: 0,
                output_resource: ResourceType::Stone,
            },
            Building {
                name: "铁矿场".to_string(),
                cost: HashMap::from([(ResourceType::Gold, 50.0)]),
                production_rate: 0.5,
                count: 0,
                output_resource: ResourceType::IronOre,
            },
            Building {
                name: "铜矿场".to_string(),
                cost: HashMap::from([(ResourceType::Gold, 40.0)]),
                production_rate: 0.6,
                count: 0,
                output_resource: ResourceType::CopperOre,
            },
            Building {
                name: "铝矿场".to_string(),
                cost: HashMap::from([(ResourceType::Gold, 60.0)]),
                production_rate: 0.4,
                count: 0,
                output_resource: ResourceType::AluminumOre,
            },
            Building {
                name: "煤矿场".to_string(),
                cost: HashMap::from([(ResourceType::Gold, 70.0)]),
                production_rate: 0.5,
                count: 0,
                output_resource: ResourceType::Coal,
            },
            Building {
                name: "石油井".to_string(),
                cost: HashMap::from([(ResourceType::Gold, 100.0)]),
                production_rate: 0.3,
                count: 0,
                output_resource: ResourceType::Oil,
            },
            Building {
                name: "水晶矿".to_string(),
                cost: HashMap::from([(ResourceType::Gold, 150.0)]),
                production_rate: 0.2,
                count: 0,
                output_resource: ResourceType::Crystal,
            },
            Building {
                name: "农场".to_string(),
                cost: HashMap::from([(ResourceType::Gold, 30.0)]),
                production_rate: 0.8,
                count: 0,
                output_resource: ResourceType::Food,
            },
        ]
    }`;

// Use regex to replace the function
const pattern = /(    fn create_test_buildings\(\) -> Vec<Building> \{)[\s\S]*?(\}\n\n    fn create_test_workers)/;
content = content.replace(pattern, newFunction + '\n\n    fn create_test_workers');

// Write back
fs.writeFileSync('src/systems/production.rs', content, 'utf8');

console.log('File updated successfully!');
