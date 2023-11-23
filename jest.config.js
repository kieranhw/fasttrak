module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
    transform: {
      // Use ts-jest for ts and tsx files
      '^.+\\.(ts|tsx)$': 'ts-jest',
      // Use babel-jest for js and jsx files
      '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['next/babel'] }],
    },
    moduleNameMapper: {
      '^@/components/(.*)$': '<rootDir>/components/$1', // For components code
      '^@/lib/(.*)$': '<rootDir>/lib/$1', // For lib code
      '^@/app/(.*)$': '<rootDir>/app/$1', // For app code
      '\\.(css|less|sass|scss)$': 'identity-obj-proxy', // For CSS modules
    },
  };
  