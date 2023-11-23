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
      // Handle module aliases and CSS imports
      '^@/components/(.*)$': '<rootDir>/components/$1',
      '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
      // Add more mappings as needed
    },
  };
  