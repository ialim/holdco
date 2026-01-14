import { createTheme } from "@mui/material/styles";

export const adminTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1F4B99",
      contrastText: "#FFFFFF"
    },
    secondary: {
      main: "#0F8B8D"
    },
    background: {
      default: "#F4F1EA",
      paper: "#FFFDFA"
    },
    text: {
      primary: "#1C1B18",
      secondary: "#6D665C"
    }
  },
  typography: {
    fontFamily: "var(--font-body)",
    h1: { fontFamily: "var(--font-display)", fontWeight: 600 },
    h2: { fontFamily: "var(--font-display)", fontWeight: 600 },
    h3: { fontFamily: "var(--font-display)", fontWeight: 600 },
    h4: { fontFamily: "var(--font-display)", fontWeight: 600 },
    h5: { fontFamily: "var(--font-display)", fontWeight: 600 },
    h6: { fontFamily: "var(--font-display)", fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 }
  },
  shape: {
    borderRadius: 16
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 253, 250, 0.94)",
          borderBottom: "1px solid #E3DED3",
          backdropFilter: "blur(10px)"
        }
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid #E3DED3",
          boxShadow: "0 18px 35px rgba(30, 26, 18, 0.12)"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #E3DED3",
          borderRadius: 18,
          backgroundColor: "#FFFDFA",
          boxShadow: "0 18px 35px rgba(30, 26, 18, 0.12)"
        }
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        title: {
          fontFamily: "var(--font-display)",
          fontWeight: 600
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#F7F3EA"
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: "0.68rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#6D665C"
        },
        body: {
          fontSize: "0.9rem"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFDFA",
          borderRadius: 12
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: "linear-gradient(180deg, #fffaf2 0%, #f5efe4 100%)",
          color: "#1C1B18",
          borderRight: "1px solid #E3DED3"
        }
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: "#1F4B99"
        }
      }
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: "#1C1B18",
          fontWeight: 600
        },
        secondary: {
          color: "#6D665C"
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: "6px 10px",
          paddingLeft: 16,
          paddingRight: 16
        },
        "&.Mui-selected": {
          backgroundColor: "rgba(31, 75, 153, 0.12)",
          color: "#1F4B99"
        },
        "&:hover": {
          backgroundColor: "rgba(31, 75, 153, 0.08)"
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(31, 75, 153, 0.04)"
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "#E3DED3"
        }
      }
    }
  }
});
