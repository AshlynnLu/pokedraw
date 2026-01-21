
import { Pokemon } from '../types';

// Simplified mapping for Chinese names for MVP (Common Gen 1 Pokemon)
const CHINESE_NAME_MAP: Record<string, string> = {
  "pikachu": "皮卡丘",
  "bulbasaur": "妙蛙种子",
  "charmander": "小火龙",
  "squirtle": "杰尼龟",
  "jigglypuff": "胖丁",
  "meowth": "喵喵",
  "psyduck": "可达鸭",
  "snorlax": "卡比兽",
  "mewtwo": "超梦",
  "dragonite": "快龙",
  "eevee": "伊布",
  "gengar": "耿鬼",
  "lucario": "路卡利欧",
  "mimikyu": "谜拟丘",
  "greninja": "甲贺忍蛙"
};

const POPULAR_IDS = [25, 1, 4, 7, 39, 52, 54, 143, 150, 149, 133, 94, 448, 778, 658];

export const getRandomPokemon = async (): Promise<Pokemon> => {
  const randomId = POPULAR_IDS[Math.floor(Math.random() * POPULAR_IDS.length)];
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    const data = await res.json();
    
    const englishName = data.name;
    const chineseName = CHINESE_NAME_MAP[englishName] || englishName;
    
    return {
      id: data.id,
      name: englishName,
      chineseName: chineseName,
      imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`
    };
  } catch (error) {
    console.error("Error fetching pokemon:", error);
    // Fallback to Pikachu
    return {
      id: 25,
      name: "pikachu",
      chineseName: "皮卡丘",
      imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
    };
  }
};
