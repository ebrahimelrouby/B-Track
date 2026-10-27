import 'react-native-get-random-values';
import 'react-native-reanimated';
import {AppRegistry, Platform} from 'react-native';
import {enableScreens} from 'react-native-screens';
import notifee, {EventType} from 'react-native-notify-kit';
import App from './App';
import {name as appName} from './app.json';
import {setPendingAlarmId} from './src/services/pendingAlarm';

enableScreens();

// Must be registered before AppRegistry.registerComponent — handles a
// notification press while the JS context isn't mounted (app backgrounded
// or killed). There's no navigator to call here, so the alarm id is stashed
// for App.tsx to pick up once it mounts.
notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type !== EventType.PRESS) return;
  const alarmId = detail.notification?.data?.alarmId;
  if (typeof alarmId === 'string') setPendingAlarmId(alarmId);
});

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === 'android') {
  const {registerWidgetTaskHandler} = require('react-native-android-widget');
  const {todayGlanceWidgetTaskHandler} = require('./src/widgets/widget-task-handler');
  registerWidgetTaskHandler(todayGlanceWidgetTaskHandler);
}
