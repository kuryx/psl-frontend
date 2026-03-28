import { createContext, useContext, useState, useEffect } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import api from "../services/api";

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences debe usarse dentro de PreferencesProvider");
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    theme: "light", // light | dark
    fontSize: "medium", // small | medium | large
    language: "es", // es | en
    fontFamily: "Roboto", // Roboto | Arial | Times New Roman
  });

  // Cargar preferencias al iniciar
  useEffect(() => {
    const savedPreferences = localStorage.getItem("userPreferences");
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  // Guardar preferencias cuando cambien
  const updatePreferences = async (newPreferences) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    localStorage.setItem("userPreferences", JSON.stringify(updated));

    // Guardar en backend (opcional)
    try {
      await api.put("/users/preferences", updated);
    } catch (error) {
      console.error("Error guardando preferencias:", error);
    }
  };

  // Configuración de tamaños de fuente
  const fontSizes = {
    small: {
      fontSize: 12,
      h1: "2rem",
      h2: "1.75rem",
      h3: "1.5rem",
      h4: "1.25rem",
      h5: "1.1rem",
      h6: "1rem",
      body1: "0.875rem",
      body2: "0.8rem",
      button: "0.8rem",
    },
    medium: {
      fontSize: 14,
      h1: "2.5rem",
      h2: "2rem",
      h3: "1.75rem",
      h4: "1.5rem",
      h5: "1.25rem",
      h6: "1.1rem",
      body1: "1rem",
      body2: "0.875rem",
      button: "0.875rem",
    },
    large: {
      fontSize: 16,
      h1: "3rem",
      h2: "2.5rem",
      h3: "2rem",
      h4: "1.75rem",
      h5: "1.5rem",
      h6: "1.25rem",
      body1: "1.125rem",
      body2: "1rem",
      button: "1rem",
    },
  };

  // Crear tema dinámico
  const theme = createTheme({
    palette: {
      mode: preferences.theme,
      primary: {
        main: preferences.theme === "dark" ? "#90caf9" : "#1976d2",
      },
      secondary: {
        main: preferences.theme === "dark" ? "#f48fb1" : "#dc004e",
      },
    },
    typography: {
      fontFamily: preferences.fontFamily,
      fontSize: fontSizes[preferences.fontSize].fontSize,
      h1: { fontSize: fontSizes[preferences.fontSize].h1 },
      h2: { fontSize: fontSizes[preferences.fontSize].h2 },
      h3: { fontSize: fontSizes[preferences.fontSize].h3 },
      h4: { fontSize: fontSizes[preferences.fontSize].h4 },
      h5: { fontSize: fontSizes[preferences.fontSize].h5 },
      h6: { fontSize: fontSizes[preferences.fontSize].h6 },
      body1: { fontSize: fontSizes[preferences.fontSize].body1 },
      body2: { fontSize: fontSizes[preferences.fontSize].body2 },
      button: { fontSize: fontSizes[preferences.fontSize].button },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
          },
        },
      },
    },
  });

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </PreferencesContext.Provider>
  );
};