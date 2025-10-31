/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import React, { useState } from 'react';
import MobileBottomNav, { RouteKey } from './src/components/MobileBottomNav';
import MyTeamScreen from './src/screens/MyTeamScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import LeaguesScreen from './src/screens/LeaguesScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [route, setRoute] = useState<RouteKey>('myteam');

  let Screen: JSX.Element;
  if (route === 'myteam') {
    Screen = <MyTeamScreen />;
  } else if (route === 'leaderboard') {
    Screen = <LeaderboardScreen />;
  } else {
    Screen = <LeaguesScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{Screen}</View>
      <MobileBottomNav currentRoute={route} onNavigate={setRoute} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 76,
  },
});

export default App;
