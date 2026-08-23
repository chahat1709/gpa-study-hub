/**
 * CAMPUS NOTIFICATION SERVICE
 * Manages Web Notification API and FCM Subscriptions.
 */

export const notificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  getPermissionStatus: (): NotificationPermission => {
    return Notification.permission;
  },

  sendLocalNotification: (title: string, body: string, url: string = '/') => {
    if (Notification.permission === 'granted') {
      const options = {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/5351/5351486.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/5351/5351486.png',
        data: { url },
      };

      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        // You could use a router here to navigate
        window.location.hash = url;
        notification.close();
      };
    }
  },

  /**
   * Broadcast logic for faculty.
   * In production, this calls a Cloud Function that triggers FCM.
   */
  broadcastToCampus: async (title: string, message: string) => {
    // Simulated delay for network handshake
    await new Promise(r => setTimeout(r, 800));

    // For local dev, we trigger it for the current user too
    notificationService.sendLocalNotification(title, message);
  },
};
