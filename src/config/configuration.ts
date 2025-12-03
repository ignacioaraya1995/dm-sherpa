export default () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    expiration: process.env.JWT_EXPIRATION || '7d',
  },

  // Telephony (Twilio)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    defaultFrom: process.env.TWILIO_DEFAULT_FROM,
  },

  // Print Vendor
  printVendor: {
    apiUrl: process.env.PRINT_VENDOR_API_URL,
    apiKey: process.env.PRINT_VENDOR_API_KEY,
  },

  // Feature flags
  features: {
    enableSyntheticData: process.env.ENABLE_SYNTHETIC_DATA === 'true',
    enableDiagnostics: process.env.ENABLE_DIAGNOSTICS !== 'false',
    enableExperiments: process.env.ENABLE_EXPERIMENTS !== 'false',
  },

  // Business defaults
  defaults: {
    // Mail timing
    minDaysBetweenMails: 21,
    maxMailsPerPropertyPerYear: 6,

    // Offers
    defaultMinOfferPercent: 0.50,
    defaultMaxOfferPercent: 0.90,

    // Experiments
    defaultConfidenceLevel: 0.95,
    minSampleSizePerVariant: 500,

    // Telephony health
    spamScoreThreshold: 0.3,
    expectedCallsPerThousandMin: 5,
    expectedCallsPerThousandMax: 25,

    // Dispo
    minDispoScoreForTargeting: 0.3,
    highDispoScoreThreshold: 0.7,
  },

  // Price bands configuration
  priceBands: {
    BAND_0_100K: { min: 0, max: 100000, label: '$0-100k' },
    BAND_100_200K: { min: 100000, max: 200000, label: '$100k-200k' },
    BAND_200_300K: { min: 200000, max: 300000, label: '$200k-300k' },
    BAND_300_500K: { min: 300000, max: 500000, label: '$300k-500k' },
    BAND_500K_PLUS: { min: 500000, max: Infinity, label: '$500k+' },
  },
});
