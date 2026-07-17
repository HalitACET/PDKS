import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {getToken} from '../services/auth';
import LoginScreen from '../screens/LoginScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import DeviceMismatchScreen from '../screens/DeviceMismatchScreen';

// ─── Tip Tanımları ────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  ChangePassword: {token: string};
  Home: {fullName?: string; token?: string} | undefined;
  DeviceMismatch: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Navigator ────────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>('Login');

  useEffect(() => {
    // Uygulama açılışında keychain'de token var mı kontrol et
    const checkToken = async () => {
      try {
        const token = await getToken();
        if (token) {
          setInitialRoute('Home');
        } else {
          setInitialRoute('Login');
        }
      } catch {
        setInitialRoute('Login');
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  // Token kontrolü sürerken yükleme göstergesi
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DeviceMismatch" component={DeviceMismatchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
