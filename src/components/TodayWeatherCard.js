import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { staticWeatherData, getWeatherIcon } from '../lib/weatherData';

const TodayWeatherCard = () => {
  const { today } = staticWeatherData;
  
  return (
    <LinearGradient
      colors={['#06b6d4', '#3b82f6']}
      style={styles.todayCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.todayHeader}>
        <View style={styles.todayInfo}>
          <Text style={styles.todayTitle}>Today</Text>
          <Text style={styles.todayDate}>{today.date}</Text>
          <Text style={styles.todayTemp}>{today.temperature}</Text>
        </View>
        <View style={styles.todayIcon}>
          <Ionicons name={getWeatherIcon(today.icon)} size={60} color="white" />
        </View>
      </View>
      
      <View style={styles.todayDetails}>
        <View style={styles.todayDetailColumn}>
          <View style={styles.todayDetailItem}>
            <Ionicons name="thermometer-outline" size={12} color="white" />
            <Text style={styles.todayDetailText}> {today.minTemp}</Text>
          </View>
          <View style={styles.todayDetailItem}>
            <Ionicons name="leaf-outline" size={12} color="white" />
            <Text style={styles.todayDetailText}> {today.windSpeed}</Text>
          </View>
        </View>
        <View style={styles.todayDetailColumn}>
          <View style={styles.todayDetailItem}>
            <Ionicons name="water-outline" size={12} color="white" />
            <Text style={styles.todayDetailText}> {today.humidity}</Text>
          </View>
          <View style={styles.todayDetailItem}>
            <Ionicons name="rainy-outline" size={12} color="white" />
            <Text style={styles.todayDetailText}> {today.rainChance}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  todayCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayInfo: {
    flex: 1,
  },
  todayTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  todayDate: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  todayTemp: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  todayIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  todayDetailColumn: {
    flex: 1,
  },
  todayDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  todayDetailText: {
    color: 'white',
    fontSize: 11,
  },
});

export default TodayWeatherCard;