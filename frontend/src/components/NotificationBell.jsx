import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import notificationService from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Set up real-time subscription
      const subscription = notificationService.subscribeToNotifications((payload) => {
        console.log('New notification received:', payload);
        if (payload.eventType === 'INSERT' && payload.new.user_id === user.id) {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Loading notifications for user:', user.id);
      const [notificationsData, unreadCountData] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount()
      ]);
      console.log('Loaded notifications:', notificationsData);
      console.log('Unread count:', unreadCountData);
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setUnreadCount(prev => prev - 1);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    }

    // Handle navigation based on notification type
    if (notification.type === 'profile_view') {
      navigate(`/profile/${notification.data.viewer_id}`);
    }

    handleClose();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (!user) return null;

  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleClick}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 360, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button 
                size="small" 
                onClick={handleMarkAllAsRead}
                startIcon={<CheckCircleIcon />}
              >
                Mark all as read
              </Button>
            )}
          </Box>
          <Divider />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  backgroundColor: notification.read ? 'inherit' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected'
                  }
                }}
              >
                <ListItemIcon>
                  {notification.type === 'profile_view' ? (
                    <VisibilityIcon color={notification.read ? 'inherit' : 'primary'} />
                  ) : (
                    <NotificationsIcon color={notification.read ? 'inherit' : 'primary'} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={notification.message}
                  secondary={new Date(notification.created_at).toLocaleString()}
                  primaryTypographyProps={{
                    color: notification.read ? 'text.secondary' : 'text.primary',
                    fontWeight: notification.read ? 'normal' : 'medium'
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell; 