export type CutState = 'Entero' | 'Cortado' | 'Pelado';
export type StorageCondition = 'Heladera (4°C)' | 'Alacena fresca (15°C)' | 'Temperatura ambiente';
export type ThermalReferenceMode = 'local' | 'ambiente';
export type RipenessState = 'Verde / Firme' | 'Óptimo' | 'Maduro' | 'Sobremaduro';
export type RiskLevel = 'Bajo' | 'Moderado' | 'Elevado';
export type FoodCategory = 'Verduras' | 'Frutas' | 'Hojas verdes';

export interface PredictionHorizon {
  risk24h: number; // 0-100%
  risk48h: number; // 0-100%
  risk72h: number; // 0-100%
}

export interface DetailedFoodAnalysis {
  temperatureOptimal: string;
  temperatureCurrent: string;
  humidityOptimal: string;
  humidityCurrent: string;
  ripenessLevel: RipenessState;
  physicalState: string;
  conservationCondition: StorageCondition;
  deteriorationFactors: string[];
}

export interface FoodAnalysisResult {
  id: string;
  name: string;
  variety?: string;
  category: FoodCategory;
  cutState: CutState;
  hoursSinceCut: number;
  estimatedShelfLife: string;
  remainingHours: number;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  horizon: PredictionHorizon;
  analysis: DetailedFoodAnalysis;
  recommendations: string[];
  estimatedWeightKg: number;
  estimatedValueArs: number;
  imageUrl: string;
  scannedAt: string;
  scientificDisclaimer: string;
  aiConfidence?: number;
}

export interface WeatherForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  humidityMean: number;
  weatherCode: number;
}

export interface ArgentineCityWeather {
  cityName: string;
  province: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  weatherCode: number;
  conditionLabel: string;
  forecast: WeatherForecastDay[];
  updatedAt: string;
}

export interface ImpactMetrics {
  savedArs: number;
  savedKg: number;
  avoidedWastePercent: number;
  itemsConsumedCount: number;
  itemsTrackedCount: number;
  co2AvoidedKg: number;
  waterSavedLiters: number;
  recentActions: {
    id: string;
    foodName: string;
    savedArs: number;
    savedKg: number;
    timestamp: string;
  }[];
}
