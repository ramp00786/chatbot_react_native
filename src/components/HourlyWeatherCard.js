import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { staticWeatherData, getWeatherIcon } from '../lib/weatherData';

const HourlyWeatherCard = () => {
  const { hourly } = staticWeatherData;
  
  return (
    <View style={styles.hourlyCard}>
      <Text style={styles.cardTitle}>Next 24 Hours</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyContainer}>
        {hourly.map((hour, index) => (
          <View key={index} style={styles.hourlyItem}>
            <Text style={styles.hourlyTime}>{hour.time}</Text>
            <Ionicons 
              name={getWeatherIcon(hour.icon)} 
              size={24} 
              color={hour.icon.includes('night') ? '#6b7280' : '#fbbf24'} 
              style={styles.hourlyIcon}
            />
            <Text style={styles.hourlyTemp}>{hour.temp}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  hourlyCard: {
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
  hourlyContainer: {
    paddingBottom: 8,
    flexDirection: 'row',
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 60,
    paddingHorizontal: 8,
  },
  hourlyTime: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  hourlyIcon: {
    marginBottom: 4,
  },
  hourlyTemp: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});

export default HourlyWeatherCard;