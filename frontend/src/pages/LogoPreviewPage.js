import React from "react";
import { Box, Typography } from "@mui/material";

export default function LogoPreviewPage() {
  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5fa"
      }}
    >
      <img
        src="/careerreco-logo.svg"
        alt="CareerReco Logo"
        style={{ width: 160, height: 160, marginBottom: 24 }}
      />
      <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
        CareerReco Logo Preview
      </Typography>
      <Typography color="text.secondary">
        This is your new project logo. Let us know if you want to tweak the design!
      </Typography>
    </Box>
  );
}
