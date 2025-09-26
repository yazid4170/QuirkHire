import { supabase } from '../supabaseClient';

const notificationService = {
  // Get all notifications for the current user
  async getNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  // Mark a notification as read
  async markAsRead(notificationId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Create a new notification
  async createNotification(userId, type, message, data = {}) {
    try {
      // Get the current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('Creating notification with data:', { 
        userId, 
        type, 
        message, 
        data,
        currentUserId: currentUser.id 
      });
      
      // Create the notification using the PostgreSQL function
      const { data: result, error } = await supabase
        .rpc('create_notification', {
          p_user_id: userId,
          p_type: type,
          p_message: message,
          p_data: {
            ...data,
            created_by: currentUser.id
          }
        });

      if (error) {
        console.error('Error creating notification:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Notification created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw error;
    }
  },

  // Get unread notification count
  async getUnreadCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
        .eq('user_id', user.id);

      if (error) throw error;
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },

  subscribeToNotifications(callback) {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        callback
      )
      .subscribe();

    return subscription;
  }
};

export { notificationService };