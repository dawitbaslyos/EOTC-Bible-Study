import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Notification, NotificationType, NotificationPriority, EthiopianHoliday, FastingSeason } from '../types';
import { getEthiopianDate } from '../utils/ethiopianCalendar';
import { showTrayNotification } from '../utils/nativeNotifications';

const STORAGE_KEY = 'senay_notifications';
const NOTIFIED_EVENTS_KEY = 'senay_notified_events';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  
  // Track events notified in the current session/day to prevent duplicates
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }

    const savedNotified = localStorage.getItem(NOTIFIED_EVENTS_KEY);
    if (savedNotified) {
      try {
        notifiedEventsRef.current = new Set(JSON.parse(savedNotified));
      } catch (e) {}
    }

    const checkEvents = async () => {
      try {
        const [holRes, fastRes] = await Promise.all([
          fetch('./data/holidays.json'),
          fetch('./data/fasting-seasons.json')
        ]);

        if (holRes.ok && fastRes.ok) {
          const holidays: EthiopianHoliday[] = await holRes.json();
          const fasting: FastingSeason[] = await fastRes.json();
          
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);

          const ethToday = getEthiopianDate(today);
          const ethTomorrow = getEthiopianDate(tomorrow);

          const todayKey = `${ethToday.year}-${ethToday.month}-${ethToday.day}`;
          
          // 1. Check Today's Holiday Celebration
          const todayHoliday = holidays.find(h => h.month === ethToday.month && h.day === ethToday.day);
          if (todayHoliday && !notifiedEventsRef.current.has(`today_${todayHoliday.id}_${todayKey}`)) {
            notify({
              title: `✨ Blessed ${todayHoliday.name}`,
              body: `Today we celebrate ${todayHoliday.name}. May the peace of the day be with you.`,
              type: 'success',
              priority: 'high'
            });
            notifiedEventsRef.current.add(`today_${todayHoliday.id}_${todayKey}`);
          }

          // 2. Check Tomorrow's Holiday (Eve)
          const tomorrowHoliday = holidays.find(h => h.month === ethTomorrow.month && h.day === ethTomorrow.day);
          if (tomorrowHoliday && !notifiedEventsRef.current.has(`eve_${tomorrowHoliday.id}_${todayKey}`)) {
            notify({
              title: `🌅 Holiday Eve: ${tomorrowHoliday.name}`,
              body: `Tomorrow we celebrate ${tomorrowHoliday.name}. Prepare your heart for the feast.`,
              type: 'info',
              priority: 'normal'
            });
            notifiedEventsRef.current.add(`eve_${tomorrowHoliday.id}_${todayKey}`);
          }

          // 3. Check Tomorrow's Fasting Season Start
          const tomorrowFast = fasting.find(f => f.ethStartMonth === ethTomorrow.month && f.ethStartDay === ethTomorrow.day);
          if (tomorrowFast && !notifiedEventsRef.current.has(`fast_${tomorrowFast.id}_${todayKey}`)) {
            notify({
              title: `🙏 Preparation for ${tomorrowFast.name}`,
              body: `The ${tomorrowFast.name} begins tomorrow. Let us prepare for a season of prayer and fasting.`,
              type: 'warning',
              priority: 'high'
            });
            notifiedEventsRef.current.add(`fast_${tomorrowFast.id}_${todayKey}`);
          }

          localStorage.setItem(NOTIFIED_EVENTS_KEY, JSON.stringify(Array.from(notifiedEventsRef.current)));
        }
      } catch (err) {
        console.error("Error checking spiritual events:", err);
      }
    };

    checkEvents();
  }, []);

  const saveNotifications = useCallback((updated: Notification[]) => {
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const notify = useCallback((n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...n,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
      read: false
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (n.priority === 'high' || n.priority === 'normal') {
      setActiveToast(newNotification);
      setTimeout(() => setActiveToast(null), 5000);
    }

    if (Capacitor.isNativePlatform() && (n.priority === 'high' || n.priority === 'normal')) {
      showTrayNotification(n.title, n.body).catch(() => {});
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    saveNotifications([]);
  }, [saveNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    notify,
    markAsRead,
    clearAll,
    unreadCount,
    activeToast,
    dismissToast: () => setActiveToast(null)
  };
};