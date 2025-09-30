import Ionicons from '@expo/vector-icons/build/Ionicons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4f46e5", // active color
      }}
    >
       <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bets"
        options={{
          title: "Your Bets",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
  name="settingPassReset"
  options={{
    href: null,
  }}
/>
<Tabs.Screen
  name="Currency"
  options={{
    href: null, 
  }}
/>
<Tabs.Screen
  name="addPayment"
  options={{
    href: null, 
  }}
/>
<Tabs.Screen
  name="settings"
  options={{
    href: null, 
  }}
/>


    </Tabs>
  );
}
