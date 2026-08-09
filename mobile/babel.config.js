const path = require('path');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: [path.resolve(__dirname, 'src')],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
      },
    ],
    // Reanimated plugin MUST be last — required for worklet creation
    'react-native-reanimated/plugin',
  ],
};
