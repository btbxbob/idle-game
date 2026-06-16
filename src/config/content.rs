use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Clone, Deserialize)]
pub struct ContentManager {
    #[serde(default)]
    pub zh_cn: Option<LanguageContent>,
    #[serde(default)]
    pub en: Option<LanguageContent>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LanguageContent {
    pub buildings: BuildingsContent,
    pub resources: ResourcesContent,
    pub technologies: TechnologiesContent,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BuildingsContent {
    pub primary: HashMap<String, BuildingText>,
    pub processing: HashMap<String, BuildingText>,
    pub dark: HashMap<String, BuildingText>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BuildingText {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ResourcesContent {
    pub tier1: HashMap<String, ResourceText>,
    pub tier2: HashMap<String, ResourceText>,
    pub tier3: HashMap<String, ResourceText>,
    pub special: HashMap<String, ResourceText>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ResourceText {
    pub name: String,
    pub icon: String,
    pub description: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TechnologiesContent {
    pub tier1: HashMap<String, TechText>,
    pub tier2: HashMap<String, TechText>,
    pub tier3: HashMap<String, TechText>,
    pub tier4: HashMap<String, TechText>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TechText {
    pub name: String,
    pub description: String,
    pub effect: String,
}

impl ContentManager {
    #[cfg(test)]
    pub fn load() -> Result<Self, String> {
        let zh_buildings = include_str!("../../content/zh-CN/buildings.json");
        let zh_resources = include_str!("../../content/zh-CN/resources.json");
        let zh_technologies = include_str!("../../content/zh-CN/technologies.json");

        let en_buildings = include_str!("../../content/en/buildings.json");
        let en_resources = include_str!("../../content/en/resources.json");
        let en_technologies = include_str!("../../content/en/technologies.json");

        let zh_cn = LanguageContent {
            buildings: serde_json::from_str(zh_buildings)
                .map_err(|e| format!("Failed to parse zh-CN buildings: {}", e))?,
            resources: serde_json::from_str(zh_resources)
                .map_err(|e| format!("Failed to parse zh-CN resources: {}", e))?,
            technologies: serde_json::from_str(zh_technologies)
                .map_err(|e| format!("Failed to parse zh-CN technologies: {}", e))?,
        };

        let en = LanguageContent {
            buildings: serde_json::from_str(en_buildings)
                .map_err(|e| format!("Failed to parse en buildings: {}", e))?,
            resources: serde_json::from_str(en_resources)
                .map_err(|e| format!("Failed to parse en resources: {}", e))?,
            technologies: serde_json::from_str(en_technologies)
                .map_err(|e| format!("Failed to parse en technologies: {}", e))?,
        };

        Ok(Self { zh_cn: Some(zh_cn), en: Some(en) })
    }

    pub fn new_empty() -> Self {
        Self {
            zh_cn: None,
            en: None,
        }
    }

    pub fn load_language(&mut self, lang: &str, buildings_json: &str, resources_json: &str, technologies_json: &str) -> Result<(), String> {
        let buildings: BuildingsContent = serde_json::from_str(buildings_json)
            .map_err(|e| format!("Failed to parse {} buildings: {}", lang, e))?;
        let resources: ResourcesContent = serde_json::from_str(resources_json)
            .map_err(|e| format!("Failed to parse {} resources: {}", lang, e))?;
        let technologies: TechnologiesContent = serde_json::from_str(technologies_json)
            .map_err(|e| format!("Failed to parse {} technologies: {}", lang, e))?;

        let lang_content = LanguageContent { buildings, resources, technologies };

        match lang {
            "zh-CN" => self.zh_cn = Some(lang_content),
            "en" => self.en = Some(lang_content),
            _ => return Err(format!("Unknown language: {}", lang)),
        }
        Ok(())
    }

    fn get_content(&self, lang: &str) -> Option<&LanguageContent> {
        if lang == "en" { self.en.as_ref() } else { self.zh_cn.as_ref() }
    }

    pub fn get_building_name(&self, building_id: &str, lang: &str) -> String {
        self.get_content(lang)
            .and_then(|c| {
                c.buildings.primary.get(building_id)
                    .or_else(|| c.buildings.processing.get(building_id))
                    .or_else(|| c.buildings.dark.get(building_id))
            })
            .map(|b| b.name.clone())
            .unwrap_or_else(|| building_id.to_string())
    }

    pub fn get_resource_name(&self, resource_id: &str, lang: &str) -> String {
        self.get_content(lang)
            .and_then(|c| {
                c.resources.tier1.get(resource_id)
                    .or_else(|| c.resources.tier2.get(resource_id))
                    .or_else(|| c.resources.tier3.get(resource_id))
                    .or_else(|| c.resources.special.get(resource_id))
            })
            .map(|r| r.name.clone())
            .unwrap_or_else(|| resource_id.to_string())
    }

    pub fn get_tech_name(&self, tech_id: &str, lang: &str) -> String {
        self.get_content(lang)
            .and_then(|c| {
                c.technologies.tier1.get(tech_id)
                    .or_else(|| c.technologies.tier2.get(tech_id))
                    .or_else(|| c.technologies.tier3.get(tech_id))
                    .or_else(|| c.technologies.tier4.get(tech_id))
            })
            .map(|t| t.name.clone())
            .unwrap_or_else(|| tech_id.to_string())
    }
}
