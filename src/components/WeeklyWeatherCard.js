import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { staticWeatherData, getWeatherIcon } from '../lib/weatherData';

const WeeklyWeatherCard = () => {
  const { weekly } = staticWeatherData;
  
  return (
    <View style={styles.weeklyCard}>
      <Text style={styles.cardTitle}>7-Day Forecast</Text>
      <View style={styles.weeklyContainer}>
        {weekly.map((day, index) => (
          <View key={index} style={styles.weeklyItem}>
            <View style={styles.weeklyLeft}>
              <Text style={[styles.weeklyDay, index === 0 && styles.todayText]}>
                {day.day}
              </Text>
              <Ionicons 
                name={getWeatherIcon(day.icon)} 
                size={20} 
                color={day.icon.includes('night') ? '#6b7280' : '#fbbf24'} 
                style={styles.weeklyIcon}
              />
            </View>
            <View style={styles.weeklyRight}>
              <Text style={styles.weeklyHigh}>{day.high}</Text>
              <Text style={styles.weeklyLow}>{day.low}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  weeklyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  weeklyContainer: {
    gap: 12,
  },
  weeklyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weeklyDay: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    width: 64,
  },
  todayText: {
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  weeklyIcon: {
    marginLeft: 8,
  },
  weeklyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weeklyHigh: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  weeklyLow: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default WeeklyWeatherCard;