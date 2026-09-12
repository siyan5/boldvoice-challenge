import { SafeAreaView, SectionList, StyleSheet, Text, View } from 'react-native';
import { Pill } from '../components';
import { colors, fonts, radii, shadows, type } from '../theme';
import { formatClockTime, formatGoal, formatHHMMSS } from '../timer/format';
import { groupByDay } from './historyStats';
import { SessionRecord } from './types';

export interface HistoryScreenProps {
  records: SessionRecord[];
  onClose(): void;
}

export function HistoryScreen({ records, onClose }: HistoryScreenProps) {
  const sections = groupByDay(records).map((group) => ({
    ...group,
    data: group.records,
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={type.sheetTitle}>History</Text>
          <Text style={styles.doneButton} onPress={onClose}>
            Done
          </Text>
        </View>

        {records.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySubtitle}>Finished sessions will show up here.</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={type.uppercaseLabel}>{section.label}</Text>
                <Text style={styles.sectionTotal}>{formatHHMMSS(section.totalMs)}</Text>
              </View>
            )}
            renderItem={({ item }) => <SessionCard record={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function SessionCard({ record }: { record: SessionRecord }) {
  const goalMet = record.totalMs >= record.goalMs;

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardName} numberOfLines={1}>
          {record.name}
        </Text>
        <Text style={styles.cardTime}>
          {formatClockTime(record.startedAt)} – {formatClockTime(record.endedAt)}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardTotal}>{formatHHMMSS(record.totalMs)}</Text>
        <Text style={styles.cardGoal}>{formatGoal(record.goalMs)} goal</Text>
        {goalMet ? (
          <Pill label="GOAL" bg="#dcfce7" color={colors.runningText} style={styles.goalPill} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  doneButton: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.inkMuted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTotal: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.ink,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.cardSm,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
    ...shadows.card,
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  cardName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
  },
  cardTime: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.inkMuted,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cardTotal: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  cardGoal: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkMuted,
  },
  goalPill: {
    marginTop: 2,
  },
});
