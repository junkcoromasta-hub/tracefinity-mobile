import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#f5f5f5',
          borderBottomColor: '#e0e0e0',
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tools',
          tabBarLabel: 'Tools',
          headerTitle: 'My Tools',
        }}
      />
      <Tabs.Screen
        name="bins"
        options={{
          title: 'Bins',
          tabBarLabel: 'Bins',
          headerTitle: 'My Bins',
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarLabel: 'Projects',
          headerTitle: 'My Projects',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 15,
  },
});
