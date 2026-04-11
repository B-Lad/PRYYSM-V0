export const MAT_CATALOG = {
    FDM: {
        types: ["PLA", "ABS", "PETG", "TPU", "PETG-CF"],
        finishes: ["Matte", "Glossy", "Satin", "Silk"],
        colors: {
            "PLA|Matte": [{ name: "PLA Black", hex: "#1C1C1C", stock: 12, unit: "spools" }, { name: "PLA White", hex: "#F5F5F0", stock: 8, unit: "spools" }, { name: "PLA Grey", hex: "#9E9E9E", stock: 4, unit: "spools" }],
            "PLA|Glossy": [{ name: "PLA Red", hex: "#E53E3E", stock: 3, unit: "spools" }, { name: "PLA Blue", hex: "#2B6CB0", stock: 6, unit: "spools" }, { name: "PLA Yellow", hex: "#ECC94B", stock: 2, unit: "spools" }],
            "PLA|Satin": [{ name: "PLA Silk Gold", hex: "#B7950B", stock: 2, unit: "spools" }, { name: "PLA Silk Silver", hex: "#BDC3C7", stock: 3, unit: "spools" }],
            "PLA|Silk": [{ name: "PLA Silk Rainbow", hex: "#9B59B6", stock: 1, unit: "spools" }, { name: "PLA Silk Bronze", hex: "#8B6914", stock: 2, unit: "spools" }],
            "ABS|Matte": [{ name: "ABS Black", hex: "#222222", stock: 4, unit: "spools" }, { name: "ABS White", hex: "#EEEEEA", stock: 2, unit: "spools" }],
            "ABS|Glossy": [{ name: "ABS Red", hex: "#C53030", stock: 0, unit: "spools" }, { name: "ABS Blue", hex: "#2C5282", stock: 1, unit: "spools" }],
            "ABS|Satin": [{ name: "ABS Grey", hex: "#718096", stock: 2, unit: "spools" }],
            "ABS|Silk": [],
            "PETG|Matte": [{ name: "PETG Black", hex: "#1A1A1A", stock: 7, unit: "spools" }, { name: "PETG White", hex: "#F0F0EE", stock: 4, unit: "spools" }],
            "PETG|Glossy": [{ name: "PETG Blue", hex: "#2B6CB0", stock: 6, unit: "spools" }, { name: "PETG Clear", hex: "#DCF0FF", stock: 3, unit: "spools" }, { name: "PETG Red", hex: "#E53E3E", stock: 2, unit: "spools" }],
            "PETG|Satin": [{ name: "PETG Grey", hex: "#A0AEC0", stock: 3, unit: "spools" }],
            "PETG|Silk": [],
            "TPU|Matte": [{ name: "TPU Black", hex: "#1A1A1A", stock: 2, unit: "spools" }, { name: "TPU Grey", hex: "#718096", stock: 3, unit: "spools" }],
            "TPU|Glossy": [{ name: "TPU Clear", hex: "#DCF0FF", stock: 1, unit: "spools" }, { name: "TPU Red", hex: "#E53E3E", stock: 1, unit: "spools" }],
            "TPU|Satin": [],
            "TPU|Silk": [],
            "PETG-CF|Matte": [{ name: "PETG-CF Black", hex: "#2D3748", stock: 4, unit: "spools" }],
            "PETG-CF|Glossy": [],
            "PETG-CF|Satin": [],
            "PETG-CF|Silk": [],
        }
    },
    SLA: {
        types: ["Standard", "ABS-Like", "Tough", "Flexible", "Castable"],
        finishes: ["Standard", "Smooth", "Translucent", "Matte"],
        colors: {
            "Standard|Standard": [{ name: "Standard Grey", hex: "#A0AEC0", stock: 4, unit: "L" }, { name: "Standard Black", hex: "#2D2D2D", stock: 2, unit: "L" }],
            "Standard|Smooth": [{ name: "Standard White", hex: "#F0F0EE", stock: 3, unit: "L" }],
            "Standard|Translucent": [{ name: "Standard Clear", hex: "#DCF0FF", stock: 2, unit: "L" }],
            "Standard|Matte": [{ name: "Standard Grey Matte", hex: "#B0B8C4", stock: 1, unit: "L" }],
            "ABS-Like|Standard": [{ name: "ABS-Like Black", hex: "#222222", stock: 2, unit: "L" }, { name: "ABS-Like White", hex: "#F0F0EE", stock: 2, unit: "L" }],
            "ABS-Like|Smooth": [{ name: "ABS-Like Red", hex: "#E53E3E", stock: 1, unit: "L" }, { name: "ABS-Like Blue", hex: "#2B6CB0", stock: 1, unit: "L" }],
            "ABS-Like|Translucent": [],
            "ABS-Like|Matte": [{ name: "ABS-Like Grey Matte", hex: "#A0AEC0", stock: 1, unit: "L" }],
            "Tough|Standard": [{ name: "Tough Grey", hex: "#A0AEC0", stock: 3, unit: "L" }],
            "Tough|Smooth": [{ name: "Tough White", hex: "#F0F0EE", stock: 5, unit: "L" }],
            "Tough|Translucent": [],
            "Tough|Matte": [],
            "Flexible|Standard": [{ name: "Flex Clear", hex: "#DCF0FF", stock: 3, unit: "L" }],
            "Flexible|Smooth": [{ name: "Flex White", hex: "#F0F0EE", stock: 2, unit: "L" }],
            "Flexible|Translucent": [{ name: "Flex Translucent", hex: "#EBF8FF", stock: 1, unit: "L" }],
            "Flexible|Matte": [],
            "Castable|Standard": [{ name: "Castable Wax", hex: "#F6E3A0", stock: 1, unit: "L" }],
            "Castable|Smooth": [],
            "Castable|Translucent": [],
            "Castable|Matte": [],
        }
    },
    SLS: {
        types: ["PA12", "PA11", "TPU Powder", "PA12-GF"],
        finishes: ["Natural", "Blasted", "Dyed", "Coated"],
        colors: {
            "PA12|Natural": [{ name: "PA12 White", hex: "#F0F0EE", stock: 25, unit: "kg" }, { name: "PA12 Grey", hex: "#C6D0DC", stock: 10, unit: "kg" }],
            "PA12|Blasted": [{ name: "PA12 White Blasted", hex: "#E8E8E4", stock: 15, unit: "kg" }],
            "PA12|Dyed": [{ name: "PA12 Black Dyed", hex: "#1A1A1A", stock: 8, unit: "kg" }, { name: "PA12 Red Dyed", hex: "#C53030", stock: 3, unit: "kg" }, { name: "PA12 Blue Dyed", hex: "#2C5282", stock: 3, unit: "kg" }],
            "PA12|Coated": [{ name: "PA12 Coated Grey", hex: "#A0AEC0", stock: 5, unit: "kg" }],
            "PA11|Natural": [{ name: "PA11 Black", hex: "#1A1A1A", stock: 8, unit: "kg" }],
            "PA11|Blasted": [{ name: "PA11 Black Blasted", hex: "#2D2D2D", stock: 4, unit: "kg" }],
            "PA11|Dyed": [{ name: "PA11 Blue Dyed", hex: "#2B6CB0", stock: 2, unit: "kg" }],
            "PA11|Coated": [],
            "TPU Powder|Natural": [{ name: "TPU Natural", hex: "#E2E8F0", stock: 15, unit: "kg" }],
            "TPU Powder|Blasted": [{ name: "TPU White Blasted", hex: "#F0F0EE", stock: 8, unit: "kg" }],
            "TPU Powder|Dyed": [],
            "TPU Powder|Coated": [],
            "PA12-GF|Natural": [{ name: "PA12-GF White", hex: "#DDE4EF", stock: 20, unit: "kg" }],
            "PA12-GF|Blasted": [{ name: "PA12-GF Blasted", hex: "#C8D4E4", stock: 10, unit: "kg" }],
            "PA12-GF|Dyed": [],
            "PA12-GF|Coated": [{ name: "PA12-GF Coated", hex: "#B0BCC8", stock: 5, unit: "kg" }],
        }
    }
};

const BLANK_MAT = () => ({ matType: "", finish: "", matName: "", custom: false, customHex: "#000000", customName: "", grams: "" });
const BLANK_GROUP = () => ({ qty: 1, materials: [BLANK_MAT()] });

