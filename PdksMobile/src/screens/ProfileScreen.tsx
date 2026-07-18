import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import {colors, typography, spacing} from '../theme';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
import {removeToken} from '../services/auth';
import {useSession, clearSession} from '../store/session';

export default function ProfileScreen({navigation}: {navigation: any}) {
  const {fullName, role, username} = useSession();
  const displayName = fullName || 'Personel';

  const subInfoParts = [
    username ? `@${username}` : null,
    role ? role : null,
  ].filter(Boolean);
  const subInfoText = subInfoParts.length > 0 ? subInfoParts.join(' · ') : 'Atlas Metal A.Ş. Personeli';

  const handleLogout = async () => {
    await removeToken();
    clearSession();
    navigation.replace('Login');
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Oturumu Kapat',
      'Çıkmak istediğinize emin misiniz?',
      [
        {text: 'Vazgeç', style: 'cancel'},
        {text: 'Evet', style: 'destructive', onPress: handleLogout},
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.dark} barStyle="light-content" />
      <ScreenHeader title="Profil" fullName={displayName} />

      <View style={styles.content}>
        <View>
          <Card style={styles.profileCard}>
            <SectionLabel text="KULLANICI BİLGİLERİ" />
            <Text style={styles.nameText}>{displayName}</Text>
            <Text style={styles.infoText}>{subInfoText}</Text>
          </Card>

          <SectionLabel text="HESAP" style={styles.accountLabel} />
          <Card style={styles.accountCard}>
            <TouchableOpacity
              style={styles.logoutRow}
              activeOpacity={0.7}
              onPress={handleLogoutPress}>
              <Text style={styles.logoutText}>Oturumu kapat</Text>
            </TouchableOpacity>
          </Card>
        </View>

        <Text style={styles.versionText}>PDKS Mobil v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  profileCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  nameText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  infoText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  accountLabel: {
    marginTop: spacing.lg,
    marginLeft: spacing.xs,
  },
  accountCard: {
    backgroundColor: colors.surface,
    padding: 0,
    overflow: 'hidden',
  },
  logoutRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  logoutText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 15,
    color: colors.danger,
  },
  versionText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
