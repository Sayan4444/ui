import { styled, Tab } from "@mui/material";
import useTheme from "../../../stores/themeStore";

const StyledTab = styled(Tab)(({ theme }) => {
  const appTheme = useTheme((state) => state.theme);
  return {
    textTransform: "none",
    fontWeight: 500,
    fontSize: "0.8rem",
    color: appTheme === "dark" ? "#d4d4d4" : theme.palette.grey[600],
    padding: "10px 17px",
    minHeight: "40px",
    marginLeft: "16px",
    marginTop: "4px",
    borderRadius: "12px 12px 12px 12px",
    border: "1px solid transparent",
    transition: "background-color 0.2s ease, border-color 0.2s ease",
    "&.Mui-selected": {
      color: "#1976d2",
      fontWeight: 600,
      border: "1px solid rgba(25, 118, 210, 0.7)",
      boxShadow: `
        -2px 0 6px rgba(47, 134, 255, 0.2),
        2px 0 6px rgba(47, 134, 255, 0.2),
        0 -2px 6px rgba(47, 134, 255, 0.2),
        0 2px 6px rgba(47, 134, 255, 0.2)
      `,
      zIndex: 1,
      position: "relative",
    },
    "&:hover": {
      backgroundColor: appTheme === "dark" ? "#333" : "#f4f4f4",
      border: appTheme === "dark" ? "1px solid #444" : "1px solid rgba(0, 0, 0, 0.1)",
    },
  };
});

export default StyledTab;