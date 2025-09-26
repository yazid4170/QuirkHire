import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminResumeDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterCert, setFilterCert] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);

  useEffect(() => {
    async function fetchResumes() {
      setLoading(true);
      const { data, error } = await supabase.from('resumes').select('*');
      if (!error) setResumes(data);
      setLoading(false);
    }
    fetchResumes();
  }, []);

  const totalResumes = resumes.length;

  const { mostCommonSkill, mostCommonLanguage, avgExperience } = useMemo(() => {
    const skillCounts = {};
    const langCounts = {};
    let totalYears = 0;

    resumes.forEach((r) => {
      (r.skills || []).forEach((s) => (skillCounts[s] = (skillCounts[s] || 0) + 1));
      (r.languages || []).forEach((l) => (langCounts[l] = (langCounts[l] || 0) + 1));
      const yrs = (r.experience || []).reduce((sum, xp) => {
        const start = new Date(xp.start_date || Date.now());
        const end = xp.end_date ? new Date(xp.end_date) : new Date();
        return sum + (end - start) / (1000 * 60 * 60 * 24 * 365);
      }, 0);
      totalYears += yrs;
    });

    const topSkill = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const avgExp = resumes.length ? (totalYears / resumes.length).toFixed(1) : '0.0';

    return { mostCommonSkill: topSkill, mostCommonLanguage: topLang, avgExperience: avgExp };
  }, [resumes]);

  const skillsDist = useMemo(() => {
    const counts = {};
    resumes.forEach((r) => (r.skills || []).forEach((s) => (counts[s] = (counts[s] || 0) + 1)));
    const top10 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      labels: top10.map(([s]) => s),
      datasets: [
        {
          label: 'Top 10 Skills',
          data: top10.map(([, c]) => c),
          backgroundColor: top10.map((_, i) => alpha(theme.palette.primary.main, 0.6)),
          borderColor: top10.map(() => theme.palette.primary.dark),
          borderWidth: 1,
        },
      ],
    };
  }, [resumes, theme]);

  const languagesDist = useMemo(() => {
    const counts = {};
    resumes.forEach((r) => (r.languages || []).forEach((l) => (counts[l] = (counts[l] || 0) + 1)));
    const entries = Object.entries(counts);
    const palette = [
      theme.palette.secondary.main,
      theme.palette.success.light,
      theme.palette.warning.light,
      theme.palette.error.light,
      theme.palette.info.light,
    ];
    return {
      labels: entries.map(([l]) => l),
      datasets: [
        {
          label: 'Languages',
          data: entries.map(([, c]) => c),
          backgroundColor: entries.map((_, i) => palette[i % palette.length]),
        },
      ],
    };
  }, [resumes, theme]);

  const certsOverTime = useMemo(() => {
    const byMonth = {};
    resumes.forEach((r) =>
      (r.certifications || []).forEach((c) => {
        const m = new Date(c.issued_at || Date.now()).toISOString().slice(0, 7);
        byMonth[m] = (byMonth[m] || 0) + 1;
      })
    );
    const months = Object.keys(byMonth).sort();
    return {
      labels: months,
      datasets: [
        {
          label: 'Certifications Over Time',
          data: months.map((m) => byMonth[m]),
          fill: false,
          borderColor: theme.palette.success.main,
          backgroundColor: alpha(theme.palette.success.main, 0.2),
          tension: 0.3,
        },
      ],
    };
  }, [resumes, theme]);

  const scoredResumes = useMemo(
    () =>
      resumes.map((r) => {
        let score = 0;
        if (r.education?.length) score += 20;
        if (r.skills?.length) score += 20;
        if (r.experience?.length) score += 20;
        if (r.languages?.length) score += 20;
        if (r.certifications?.length) score += 20;
        return { ...r, completenessScore: score };
      }),
    [resumes]
  );

  const displayed = useMemo(
    () =>
      scoredResumes
        .filter((r) => {
          return (
            (!searchQuery ||
              (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
              (r.user_id || '').includes(searchQuery)) &&
            (!filterSkill || (r.skills || []).includes(filterSkill)) &&
            (!filterLanguage || (r.languages || []).includes(filterLanguage)) &&
            (!filterCert || (r.certifications || []).some((c) => c.name === filterCert))
          );
        })
        .sort((a, b) => {
          if (sortBy === 'score') return b.completenessScore - a.completenessScore;
          return new Date(b.created_at) - new Date(a.created_at);
        }),
    [scoredResumes, searchQuery, filterSkill, filterLanguage, filterCert, sortBy]
  );

  return (
    <Container sx={{ my: 4 }}>
      {/* Title + toggle back */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Resume Dashboard
        </Typography>
        <Button variant="outlined" color="primary" onClick={() => navigate('/admin-dashboard')}>
          Admin Dashboard
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          ['Total Resumes', totalResumes],
          ['Top Skill', mostCommonSkill],
          ['Top Language', mostCommonLanguage],
          ['Avg. Experience (yrs)', avgExperience],
        ].map(([t, v]) => (
          <Grid item xs={12} sm={6} md={3} key={t}>
            <Card elevation={3} sx={{ textAlign: 'center', py: 2, borderLeft: `5px solid ${theme.palette.primary.main}` }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {t}
                </Typography>
                <Typography variant="h5" color="primary">
                  {v}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2, boxShadow: 1 }}>
            <Typography variant="h6" gutterBottom>
              Skills Distribution
            </Typography>
            <Box sx={{ height: 240 }}>
              <Bar data={skillsDist} options={{ maintainAspectRatio: false }} />
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2, boxShadow: 1 }}>
            <Typography variant="h6" gutterBottom>
              Languages
            </Typography>
            <Box sx={{ height: 240 }}>
              <Pie data={languagesDist} options={{ maintainAspectRatio: false }} />
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2, boxShadow: 1 }}>
            <Typography variant="h6" gutterBottom>
              Certifications Over Time
            </Typography>
            <Box sx={{ height: 240 }}>
              <Line data={certsOverTime} options={{ maintainAspectRatio: false }} />
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <TextField
          size="small"
          label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: '1 1 200px' }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Skill</InputLabel>
          <Select value={filterSkill} label="Skill" onChange={(e) => setFilterSkill(e.target.value)}>
            <MenuItem value="">
              <em>Any</em>
            </MenuItem>
            {skillsDist.labels.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Language</InputLabel>
          <Select value={filterLanguage} label="Language" onChange={(e) => setFilterLanguage(e.target.value)}>
            <MenuItem value="">
              <em>Any</em>
            </MenuItem>
            {languagesDist.labels.map((l) => (
              <MenuItem key={l} value={l}>
                {l}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Certification</InputLabel>
          <Select value={filterCert} label="Certification" onChange={(e) => setFilterCert(e.target.value)}>
            <MenuItem value="">
              <em>Any</em>
            </MenuItem>
            {[...new Set(resumes.flatMap((r) => r.certifications?.map((c) => c.name) || []))].map((cn) => (
              <MenuItem key={cn} value={cn}>
                {cn}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="created_at">Creation Date</MenuItem>
            <MenuItem value="score">Completeness Score</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {loading ? (
        <Typography>Loading…</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name / ID</TableCell>
              <TableCell>Completeness</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No resumes found.
                </TableCell>
              </TableRow>
            ) : (
              displayed.map((r) => (
                <TableRow key={r.id} sx={{ '&:nth-of-type(odd)': { bgcolor: theme.palette.action.hover } }}>
                  <TableCell>
                    <Typography variant="body1" color="text.primary">
                      {r.name || '(no name)'}
                      <Typography component="span" variant="caption" color="text.secondary">
                        &nbsp;({r.user_id})
                      </Typography>
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ width: 240 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={r.completenessScore}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: theme.palette.primary.main,
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="primary">
                        {r.completenessScore}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(r.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setSelectedResume(r);
                        setOpenDetail(true);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Detail Modal */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.dark }}>
          Resume Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedResume && (
            <>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Education
              </Typography>
              <ul>
                {selectedResume.education?.map((ed, i) => (
                  <li key={i}>{ed.degree} — {ed.institution}</li>
                ))}
              </ul>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Skills
              </Typography>
              <Typography>{selectedResume.skills?.join(', ')}</Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Experience
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Dates</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedResume.experience?.map((xp, i) => (
                    <TableRow key={i}>
                      <TableCell>{xp.title}</TableCell>
                      <TableCell>{xp.company}</TableCell>
                      <TableCell>
                        {new Date(xp.start_date).toLocaleDateString()} —{' '}
                        {xp.end_date ? new Date(xp.end_date).toLocaleDateString() : 'Present'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Languages
              </Typography>
              <Typography>{selectedResume.languages?.join(', ')}</Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Certifications
              </Typography>
              <ul>
                {selectedResume.certifications?.map((c, i) => (
                  <li key={i}>{c.name} — {new Date(c.issued_at).toLocaleDateString()}</li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}