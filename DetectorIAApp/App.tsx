import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ focused, icon }: { focused: boolean; icon: string }) {
  return (
    <View style={{
      width: 46, height: 32, borderRadius: 8,
      backgroundColor: focused ? 'rgba(59,130,246,0.15)' : 'transparent',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{icon}</Text>
    </View>
  );
}

export default function App() {
  const [history, setHistory] = useState<any[]>([]);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#08101E',
            borderTopWidth: 1,
            borderTopColor: '#112030',
            height: 66,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#1E3048',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.3,
          },
        }}>
        <Tab.Screen
          name="Monitor"
          options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="🎙️" /> }}>
          {() => <HomeScreen history={history} setHistory={setHistory} />}
        </Tab.Screen>
        <Tab.Screen
          name="Dashboard"
          options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📊" /> }}>
          {() => <DashboardScreen history={history} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
