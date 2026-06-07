const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TryOn Professional Backend API",
      version: "1.0.0",
      description:
        "API for virtual try-on, garment analysis, wardrobe management, outfit recommendations, recycling/upcycling, weather-based matching, and more.",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
        WardrobeItem: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user_id: { type: "string" },
            name: { type: "string" },
            type: { type: "string" },
            category: {
              type: "string",
              enum: ["top", "bottom", "outerwear", "dress", "footwear", "accessory"],
            },
            colors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  color: { type: "string" },
                  percentage: { type: "number" },
                },
              },
            },
            color: { type: "string" },
            style: {
              type: "string",
              enum: ["casual", "smart-casual", "formal", "streetwear", "sport"],
            },
            pattern: {
              type: "string",
              enum: ["solid", "striped", "checked", "graphic", "floral"],
            },
            season: {
              type: "array",
              items: {
                type: "string",
                enum: ["spring", "summer", "autumn", "winter"],
              },
            },
            gender: {
              type: "string",
              enum: ["male", "female", "unisex"],
            },
            confidence: { type: "number" },
            image: { type: "string", nullable: true },
            analysis_id: { type: "string", nullable: true },
            garment_index: { type: "integer", nullable: true },
            source: {
              type: "string",
              enum: ["analysis", "manual"],
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        WeatherData: {
          type: "object",
          properties: {
            temperature: { type: "number", description: "Current temperature in °C" },
            feelsLike: { type: "number", description: "Apparent temperature in °C" },
            condition: {
              type: "string",
              enum: ["clear", "mainly_clear", "partly_cloudy", "overcast", "fog", "drizzle", "rain", "snow", "rain_showers", "thunderstorm"],
            },
            humidity: { type: "number", description: "Relative humidity %" },
            windSpeed: { type: "number", description: "Wind speed in km/h" },
            isDay: { type: "boolean" },
            weatherCode: { type: "integer" },
          },
        },
        Garment: {
          type: "object",
          properties: {
            category: { type: "string", enum: ["top", "bottom", "outerwear", "dress", "footwear", "accessory"] },
            specificType: { type: "string" },
            confidence: { type: "number" },
            colors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  color: { type: "string" },
                  percentage: { type: "number" },
                },
              },
            },
            style: { type: "string", enum: ["casual", "smart-casual", "formal", "streetwear", "sport"] },
            pattern: { type: "string", enum: ["solid", "striped", "checked", "graphic", "floral"] },
            season: { type: "array", items: { type: "string", enum: ["spring", "summer", "autumn", "winter"] } },
            gender: { type: "string", enum: ["male", "female", "unisex"] },
          },
        },
        Analysis: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user_id: { type: "string" },
            image_hash: { type: "string" },
            garments: { type: "array", items: { $ref: "#/components/schemas/Garment" } },
            detectionType: { type: "string", enum: ["single", "multiple", "outfit", "unknown"] },
            image: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
