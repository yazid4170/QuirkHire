import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { supabase } from '../supabaseClient';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setReviews(data);
    setLoading(false);
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Reviews</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>Candidate Reviews</Typography>
            {reviews.filter(r => r.role === 'candidate').length ? (
              <List>
                {reviews.filter(r => r.role === 'candidate').map(r => (
                  <ListItem key={r.id} alignItems="flex-start">
                    <ListItemText
                      primary={r.content}
                      secondary={new Date(r.created_at).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No candidate reviews.</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="h5" gutterBottom>Recruiter Reviews</Typography>
            {reviews.filter(r => r.role === 'recruiter').length ? (
              <List>
                {reviews.filter(r => r.role === 'recruiter').map(r => (
                  <ListItem key={r.id} alignItems="flex-start">
                    <ListItemText
                      primary={r.content}
                      secondary={new Date(r.created_at).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No recruiter reviews.</Typography>
            )}
          </Box>
        </>
      )}
    </Container>
  );
};

export default ReviewsPage;
