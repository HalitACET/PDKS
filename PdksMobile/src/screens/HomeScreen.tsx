import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {getToken} from '../services/auth';
import {getNextAction, NextActionResponse} from '../services/api';
import {useSession} from '../store/session';
import {colors, typography, spacing, radius} from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';

type Props = any;

// ─── Özel İkon Çizimleri ──────────────────────────────────────────────────────

const QrGridIcon = ({color}: {color: string}) => (
  <View style={styles.qrIconContainer}>
    <View style={styles.qrDotRow}>
      <View style={[styles.qrDot, {backgroundColor: color}]} />
      <View style={[styles.qrDot, {backgroundColor: color}]} />
    </View>
    <View style={styles.qrDotRow}>
      <View style={[styles.qrDot, {backgroundColor: color}]} />
      <View style={[styles.qrDot, {backgroundColor: color}]} />
    </View>
  </View>
);

const GpsTargetIcon = ({color}: {color: string}) => (
  <View style={[styles.gpsIconContainer, {borderColor: color}]}>
    <View style={[styles.gpsDot, {backgroundColor: color}]} />
  </View>
);

// ──────────────────────────────────────────────────────────────────────────────

export default function HomeScreen({navigation}: Props) {
  const isFocused = useIsFocused();
  const {fullName: sessionFullName} = useSession();
  const fullName = sessionFullName || 'Personel';
  const [nextAction, setNextAction] = useState<NextActionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const token = await getToken();
      if (!token) {
        navigation.replace('Login');
        return;
      }
      const data = await getNextAction(token);
      setNextAction(data);
    } catch (err: any) {
      if (err.isDeviceMismatch) {
        navigation.replace('DeviceMismatch');
        return;
      }
      console.error('Failed to load home data:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  // Helper to format time (HH:mm) from LocalDateTime string
  const formatTime = (tsStr?: string) => {
    if (!tsStr) return '';
    try {
      const parts = tsStr.split('T');
      if (parts.length > 1) {
        return parts[1].substring(0, 5);
      }
    } catch (e) {
      // fallback
    }
    return '';
  };

  // Bugün geçirilen süreyi hesapla
  const getTodayDuration = () => {
    const last = nextAction?.lastTransaction;
    if (!last || last.type !== 'GIRIS') {
      return {duration: '—', since: ''};
    }

    try {
      const txTime = new Date(last.timestamp);
      const now = new Date();
      
      // Aynı gün kontrolü
      if (txTime.toDateString() === now.toDateString()) {
        const diffMs = now.getTime() - txTime.getTime();
        if (diffMs > 0) {
          const totalMins = Math.floor(diffMs / 60000);
          const hrs = Math.floor(totalMins / 60);
          const mins = totalMins % 60;
          
          // Giriş saatini biçimlendir
          const enterTime = last.timestamp.split('T')[1].substring(0, 5);
          
          return {
            duration: `${hrs} sa ${mins} dk`,
            since: `${enterTime}'den beri`,
          };
        }
      }
    } catch (e) {
      // pas geç
    }
    return {duration: '—', since: ''};
  };

  const {duration: todayDuration, since: sinceText} = getTodayDuration();

  const renderStatusCard = () => {
    if (loading) {
      return (
        <Card style={styles.loadingCard}>
          <ActivityIndicator size="small" color={colors.primary} />
        </Card>
      );
    }

    const isInside = nextAction?.suggestedType === 'CIKIS';
    const statusText = isInside ? 'İÇERİDESİNİZ' : 'DIŞARIDASINIZ';
    const last = nextAction?.lastTransaction;
    
    let lastText = 'Henüz geçiş kaydı yok';
    if (last) {
      const typeText = last.type === 'GIRIS' ? 'Giriş' : 'Çıkış';
      const timeText = formatTime(last.timestamp);
      const locText = last.locationName || 'GPS';
      lastText = `Son hareket: ${typeText} · ${timeText} · ${locText}`;
    }

    return (
      <Card variant={isInside ? 'success' : 'dark'} style={styles.statusCard}>
        <SectionLabel text="ŞU ANKİ DURUMUNUZ" onDark />
        <Text style={styles.statusText}>{statusText}</Text>
        <Text style={styles.lastText}>
          <Text style={{color: isInside ? '#FFF' : colors.primary}}>● </Text>
          {lastText}
        </Text>
      </Card>
    );
  };

  const actionText = nextAction?.suggestedType === 'CIKIS' ? 'ÇIKIŞ' : 'GİRİŞ';

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor={colors.dark} barStyle="light-content" />
      <ScreenHeader
        companyName="ATLAS METAL A.Ş."
        title={`Merhaba, ${fullName.split(' ')[0]}`}
        fullName={fullName}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {renderStatusCard()}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.qrButton]}
            disabled={loading}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('QrScan')}>
            <QrGridIcon color={colors.textOnPrimary} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionButtonText}>QR İLE {actionText}</Text>
              <Text style={styles.actionSubtext}>Kapıdaki kodu okutun</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.gpsButton]}
            disabled={loading}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('GpsTransaction')}>
            <GpsTargetIcon color={colors.textOnDark} />
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionButtonText, {color: colors.textOnDark}]}>
                KONUM İLE {actionText}
              </Text>
              <Text style={[styles.actionSubtext, {color: colors.textOnDarkMuted}]}>
                Tesis alanındayken kullanın
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <Card style={styles.bottomCard}>
            <SectionLabel text="Vardiya" />
            <Text style={styles.bottomCardValue}>08:00 – 17:00</Text>
            <Text style={styles.bottomCardSub}>Gündüz vardiyası</Text>
          </Card>
          
          <Card style={styles.bottomCard}>
            <SectionLabel text="Bugün" />
            <Text style={styles.bottomCardValue}>{todayDuration}</Text>
            {sinceText !== '' && (
              <Text style={styles.bottomCardSub}>{sinceText}</Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    backgroundColor: colors.surface,
  },
  statusCard: {
    padding: spacing.lg,
    justifyContent: 'center',
  },
  statusText: {
    color: colors.textOnDark,
    fontFamily: typography.fontFamilyBold,
    fontSize: 28,
    marginVertical: spacing.xs,
  },
  lastText: {
    color: colors.textOnDarkMuted,
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
  },
  actionsContainer: {
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  qrButton: {
    backgroundColor: colors.primary,
  },
  gpsButton: {
    backgroundColor: colors.dark,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionButtonText: {
    color: colors.textOnPrimary,
    fontFamily: typography.fontFamilyBold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  actionSubtext: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 11,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bottomCard: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.surface,
    minHeight: 110,
    justifyContent: 'center',
  },
  bottomCardValue: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  bottomCardSub: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qrIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginRight: spacing.md,
  },
  qrDotRow: {
    flexDirection: 'row',
    gap: 4,
  },
  qrDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  gpsIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
