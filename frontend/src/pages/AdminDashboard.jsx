// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Card,
  CardContent,
  Avatar,
  useTheme,
  alpha,
} from "@mui/material";
import { supabase } from "../supabaseClient";

import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();

  // ─── State ─────────────────────────────────────────
  const [profiles, setProfiles] = useState([]);
  const [recProfiles, setRecProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, msg: "", sev: "success" });

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    type: "User",
    id: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "candidate",
    phone: "",
    address: "",
    company: "",
    profile_picture: "",
    description: "",
    bio: "",
    website: "",
    linkedin: "",
    github: "",
    twitter: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);

  // ─── Admin Guard + Initial Fetch ──────────────────
  useEffect(() => {
    (async () => {
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      if (sessErr || !session) return navigate("/login");

      const { data: me, error: meErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (meErr || me.role !== "admin") return navigate("/");

      await fetchAll();
    })();
  }, [navigate]);

  // fetch both tables
  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchProfiles(), fetchRecProfiles()]);
    setLoading(false);
  }

  async function fetchProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, email, role, profile_picture, created_at"
      );
    if (error) {
      setAlert({ open: true, msg: error.message, sev: "error" });
    } else {
      setProfiles(data);
    }
  }

  async function fetchRecProfiles() {
    const { data, error } = await supabase
      .from("recruiter_profiles")
      .select(
        "id, email, company, profile_picture, description, phone, website, linkedin, twitter, created_at"
      )
      .order("created_at", { ascending: false });
    if (error) {
      setAlert({ open: true, msg: error.message, sev: "error" });
    } else {
      setRecProfiles(data);
    }
  }

  // helper for avatar URLs
  function getAvatarUrl(pic) {
    if (!pic) return "https://via.placeholder.com/40";
    if (pic.startsWith("http")) return pic;
    return `https://vnylejypvgatgsvomjsk.supabase.co/storage/v1/object/public/avatars/${pic}`;
  }

  // Modal openers
  function openCreate(type) {
    setEditing(null);
    setForm({
      type,
      id: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: type === "Recruiter" ? "recruiter" : "candidate",
      phone: "",
      address: "",
      company: "",
      profile_picture: "",
      description: "",
      bio: "",
      website: "",
      linkedin: "",
      github: "",
      twitter: "",
    });
    setAvatarFile(null);
    setOpenModal(true);
  }

  function openEdit(item, type) {
    setEditing({ type, id: item.id });
    setForm({ ...item, type, password: "" });
    setAvatarFile(null);
    setOpenModal(true);
  }

  // Form handlers
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleFile = (e) => setAvatarFile(e.target.files?.[0] || null);

  // Save (create/update)
  async function handleSave() {
    let picPath = form.profile_picture;
    if (avatarFile) {
      const filename = `${Date.now()}_${avatarFile.name}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(filename, avatarFile, { upsert: true });
      if (upErr)
        return setAlert({ open: true, msg: upErr.message, sev: "error" });
      picPath = filename;
    }

    if (!editing) {
      // CREATE
      if (form.type === "User") {
        const { data: authData, error: signErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });
        if (signErr)
          return setAlert({ open: true, msg: signErr.message, sev: "error" });

        const { error: insErr } = await supabase.from("profiles").insert([
          {
            id: authData.user.id,
            email: form.email,
            first_name: form.first_name,
            last_name: form.last_name,
            role: form.role,
            phone: form.phone,
            address: form.address,
            profile_picture: picPath,
            bio: form.bio,
            website: form.website,
            linkedin: form.linkedin,
            github: form.github,
            twitter: form.twitter,
          },
        ]);
        if (insErr)
          return setAlert({ open: true, msg: insErr.message, sev: "error" });
        setAlert({ open: true, msg: "User created", sev: "success" });
      } else {
        const { error: rErr } = await supabase
          .from("recruiter_profiles")
          .insert([
            {
              email: form.email,
              company: form.company,
              profile_picture: picPath,
              description: form.description,
              phone: form.phone,
              website: form.website,
              linkedin: form.linkedin,
              twitter: form.twitter,
            },
          ]);
        if (rErr)
          return setAlert({ open: true, msg: rErr.message, sev: "error" });
        setAlert({ open: true, msg: "Recruiter created", sev: "success" });
      }
    } else {
      // UPDATE
      if (form.type === "User") {
        const updates = {
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
          phone: form.phone,
          address: form.address,
          profile_picture: picPath,
          bio: form.bio,
          website: form.website,
          linkedin: form.linkedin,
          github: form.github,
          twitter: form.twitter,
        };
        const { error: uErr } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", editing.id);
        if (uErr)
          return setAlert({ open: true, msg: uErr.message, sev: "error" });
        setAlert({ open: true, msg: "User updated", sev: "success" });
      } else {
        const updates = {
          email: form.email,
          company: form.company,
          profile_picture: picPath,
          description: form.description,
          phone: form.phone,
          website: form.website,
          linkedin: form.linkedin,
          twitter: form.twitter,
        };
        const { error: rErr } = await supabase
          .from("recruiter_profiles")
          .update(updates)
          .eq("id", editing.id);
        if (rErr)
          return setAlert({ open: true, msg: rErr.message, sev: "error" });
        setAlert({ open: true, msg: "Recruiter updated", sev: "success" });
      }
    }

    setOpenModal(false);
    fetchAll();
  }

  // Delete
  async function handleDelete() {
    if (!editing) return;
    if (editing.type === "User") {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", editing.id);
      if (error)
        return setAlert({ open: true, msg: error.message, sev: "error" });
      setAlert({ open: true, msg: "User deleted", sev: "success" });
    } else {
      const { error } = await supabase
        .from("recruiter_profiles")
        .delete()
        .eq("id", editing.id);
      if (error)
        return setAlert({ open: true, msg: error.message, sev: "error" });
      setAlert({ open: true, msg: "Recruiter deleted", sev: "success" });
    }
    setOpenModal(false);
    fetchAll();
  }

  // ─── Charts Data ───────────────────────────────────
  const roleCounts = useMemo(() => {
    const candidate = profiles.filter(
      (u) => (u.role || "candidate").toLowerCase() === "candidate"
    ).length;
    const admin = profiles.filter(
      (u) => (u.role || "candidate").toLowerCase() === "admin"
    ).length;
    const recruiter = recProfiles.length;
    return { candidate, admin, recruiter };
  }, [profiles, recProfiles]);

  const roles = ["Candidate", "Admin", "Recruiter"];
  const solid = [
    theme.palette.primary.main,
    theme.palette.warning.main,
    theme.palette.secondary.main,
  ];
  const translucent = solid.map((c) => alpha(c, 0.6));

  const barData = {
    labels: roles,
    datasets: [
      {
        label: "Profiles by Role",
        data: [
          roleCounts.candidate,
          roleCounts.admin,
          roleCounts.recruiter,
        ],
        backgroundColor: translucent,
        borderColor: solid,
        borderWidth: 1,
      },
    ],
  };

  const dateMap = useMemo(() => {
    const initCounts = { candidate: 0, admin: 0, recruiter: 0 };
    const m = {};

    profiles.forEach(({ created_at, role }) => {
      const d = new Date(created_at).toLocaleDateString();
      if (!m[d]) m[d] = { ...initCounts };
      const key = (role || "candidate").toLowerCase();
      if (key === "candidate" || key === "admin") {
        m[d][key]++;
      }
    });

    recProfiles.forEach(({ created_at }) => {
      const d = new Date(created_at).toLocaleDateString();
      if (!m[d]) m[d] = { ...initCounts };
      m[d].recruiter++;
    });

    const dates = Object.keys(m).sort((a, b) => new Date(a) - new Date(b));
    return { dates, m };
  }, [profiles, recProfiles]);

  const lineData = {
    labels: dateMap.dates,
    datasets: [
      {
        label: "Candidate",
        data: dateMap.dates.map((d) => dateMap.m[d].candidate),
        fill: false,
        tension: 0.3,
        borderColor: solid[0],
        backgroundColor: translucent[0],
      },
      {
        label: "Admin",
        data: dateMap.dates.map((d) => dateMap.m[d].admin),
        fill: false,
        tension: 0.3,
        borderColor: solid[1],
        backgroundColor: translucent[1],
      },
      {
        label: "Recruiter",
        data: dateMap.dates.map((d) => dateMap.m[d].recruiter),
        fill: false,
        tension: 0.3,
        borderColor: solid[2],
        backgroundColor: translucent[2],
      },
    ],
  };

  const chartBox = { p: 2, bgcolor: theme.palette.grey[100], borderRadius: 2 };

  const combined = [
    ...profiles.map((u) => ({ type: "User", ...u })),
    ...recProfiles.map((r) => ({ type: "Recruiter", ...r })),
  ];

  return (
    <Container sx={{ my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Info Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          ["Total Users", profiles.length],
          ["Candidates", roleCounts.candidate],
          ["Admins", roleCounts.admin],
          ["Recruiters", recProfiles.length],
        ].map(([title, val]) => (
          <Grid item xs={12} sm={6} md={3} key={title}>
            <Card elevation={3} sx={{ textAlign: "center", py: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">{title}</Typography>
                <Typography variant="h3">{val}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Box sx={chartBox}>
            <Typography variant="h6">Profiles by Role</Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={barData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={chartBox}>
            <Typography variant="h6">Profile Creation Trend</Typography>
            <Box sx={{ height: 300 }}>
              <Line data={lineData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={() => openCreate("User")}>
          New User
        </Button>
        <Button variant="contained" onClick={() => openCreate("Recruiter")}>
          New Recruiter
        </Button>
      </Box>

      {/* Combined Table */}
      {loading ? (
        <Typography>Loading…</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Avatar</TableCell>
              <TableCell>First</TableCell>
              <TableCell>Last</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {combined.map((row) => (
              <TableRow key={`${row.type}-${row.id}`}>
                <TableCell>{row.type}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>
                  {row.role || (row.type === "Recruiter" ? "recruiter" : "")}
                </TableCell>
                <TableCell>
                  <Avatar src={getAvatarUrl(row.profile_picture)}>
                    {!row.profile_picture &&
                      (row.first_name?.[0] || row.company?.[0] || "?")}
                  </Avatar>
                </TableCell>
                <TableCell>{row.first_name}</TableCell>
                <TableCell>{row.last_name}</TableCell>
                <TableCell>{row.company}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>
                  {new Date(row.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => openEdit(row, row.type)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => openEdit(row, row.type)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create/Edit/Delete Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {(editing ? "Edit" : "Create") + " " + form.type}
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
              mt: 1,
            }}
          >
            {/* Common fields */}
            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
            />
            {form.type === "User" && !editing && (
              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                fullWidth
              />
            )}
            {form.type === "User" && (
              <>
                <TextField
                  label="First Name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  label="Last Name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  fullWidth
                />
                <Select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  fullWidth
                >
                  {["candidate", "recruiter", "admin"].map((r) => (
                    <MenuItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </>
            )}
            {form.type === "Recruiter" && (
              <TextField
                label="Company"
                name="company"
                value={form.company}
                onChange={handleChange}
                fullWidth
              />
            )}
            {/* Shared */}
            <TextField
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Website"
              name="website"
              value={form.website}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="LinkedIn"
              name="linkedin"
              value={form.linkedin}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Twitter"
              name="twitter"
              value={form.twitter}
              onChange={handleChange}
              fullWidth
            />
            {/* Avatar */}
            <TextField
              label="Avatar URL"
              name="profile_picture"
              value={form.profile_picture}
              onChange={handleChange}
              fullWidth
            />
            <Button variant="outlined" component="label">
              Upload Avatar
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFile}
              />
            </Button>
            {avatarFile && <Typography>{avatarFile.name}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          {editing && (
            <Button color="error" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button variant="contained" onClick={handleSave}>
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={() => setAlert((a) => ({ ...a, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAlert((a) => ({ ...a, open: false }))}
          severity={alert.sev}
          sx={{ width: "100%" }}
        >
          {alert.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
