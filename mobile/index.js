import 'react-native-reanimated';
import {AppRegistry, Platform} from 'react-native';
import {enableScreens} from 'react-native-screens';
import App from './App';
import {name as appName} from './app.json';

enableScreens();

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === 'android') {
  const {registerWidgetTaskHandler} = require('react-native-android-widget');
  const {todayGlanceWidgetTaskHandler} = require('./src/widgets/widget-task-handler');
  registerWidgetTaskHandler(todayGlanceWidgetTaskHandler);
}
