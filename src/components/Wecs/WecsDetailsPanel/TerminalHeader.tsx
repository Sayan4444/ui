import { Box, CircularProgress, FormControl, IconButton, MenuItem, Select, Tooltip, Typography, SelectChangeEvent } from '@mui/material';
import React from 'react'
import { FiMaximize2, FiMinimize2, FiTrash2 } from 'react-icons/fi';
import { ContainerInfo } from './WecsDetailsPanel';

interface TerminalHeaderProps {
    theme:string;
    name:string;  
    setIsContainerSelectActive: React.Dispatch<React.SetStateAction<boolean>>;
    selectedContainer:string;
    handleContainerChange:(event: SelectChangeEvent<string>) => void;
    loadingContainers:boolean;
    containers:ContainerInfo[];
    handleClearTerminal:() => void;
    isTerminalMaximized:boolean;
    setIsTerminalMaximized: React.Dispatch<React.SetStateAction<boolean>>;
}

const TerminalHeader = ({ theme, name, setIsContainerSelectActive, selectedContainer, handleContainerChange, loadingContainers, containers, handleClearTerminal, isTerminalMaximized, setIsTerminalMaximized }:TerminalHeaderProps) => {
  return (
      <Box
          sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 0.75,
              backgroundColor: theme === "dark" ? "#252525" : "#F0F0F0",
              borderBottom: theme === "dark" ? "1px solid #333" : "1px solid #E0E0E0",
              fontSize: "13px",
              fontWeight: 500,
              color: theme === "dark" ? "#CCC" : "#444",
              fontFamily: '"Segoe UI", "Helvetica", "Arial", sans-serif'
          }}
      >
          <Box sx={{ display: "flex", alignItems: "center" }}>
              <span
                  style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: "#98C379",
                      marginRight: "8px"
                  }}
              />
              {name}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Container selection dropdown */}
              <FormControl
                  size="small"
                  className="container-dropdown"
                  onMouseDown={() => {
                      console.log("Container dropdown interaction started");
                      setIsContainerSelectActive(true);
                  }}
                  sx={{
                      minWidth: 150,
                      "& .MuiInputBase-root": {
                          color: theme === "dark" ? "#CCC" : "#444",
                          fontSize: "13px",
                          backgroundColor: theme === "dark" ? "#333" : "#FFF",
                          border: theme === "dark" ? "1px solid #444" : "1px solid #DDD",
                          borderRadius: "4px",
                          height: "30px"
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                          border: "none"
                      }
                  }}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.stopPropagation();
                  }}
              >
                  <Select
                      value={selectedContainer}
                      onChange={handleContainerChange}
                      displayEmpty
                      onMouseDown={(e: React.MouseEvent<HTMLElement>) => {
                          e.stopPropagation();
                          console.log("Select mousedown");
                          setIsContainerSelectActive(true);
                      }}
                      onClose={() => {
                          console.log("Select dropdown closed");
                          // Delay setting this to false to allow click events to process first
                          setTimeout(() => setIsContainerSelectActive(false), 300);
                      }}
                      MenuProps={{
                          slotProps: {
                              paper: {
                                  onClick: (e: React.MouseEvent<HTMLDivElement>) => {
                                      e.stopPropagation();
                                  },
                                  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
                                      e.stopPropagation();
                                      setIsContainerSelectActive(true);
                                  },
                                  style: {
                                      zIndex: 9999
                                  }
                              },
                              root: {
                                  onClick: (e: React.MouseEvent<HTMLDivElement>) => {
                                      e.stopPropagation();
                                  },
                                  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
                                      e.stopPropagation();
                                      setIsContainerSelectActive(true);
                                  }
                              }
                          },
                          // Prevent menu from closing the panel by setting anchorOrigin and transformOrigin
                          anchorOrigin: {
                              vertical: 'bottom',
                              horizontal: 'left',
                          },
                          transformOrigin: {
                              vertical: 'top',
                              horizontal: 'left',
                          }
                      }}
                      renderValue={(value) => (
                          <Box
                              sx={{ display: "flex", alignItems: "center" }}
                              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                  e.stopPropagation();
                              }}
                          >
                              {loadingContainers ? (
                                  <CircularProgress size={14} sx={{ mr: 1 }} />
                              ) : (
                                  <span className="fas fa-cube" style={{ marginRight: "8px", fontSize: "12px" }} />
                              )}
                              {value || "Select container"}
                          </Box>
                      )}
                  >
                      {containers.map((container) => (
                          <MenuItem
                              key={container.ContainerName}
                              value={container.ContainerName}
                              sx={{
                                  fontSize: "13px",
                                  py: 0.75
                              }}
                              onMouseDown={(e: React.MouseEvent<HTMLLIElement>) => {
                                  e.stopPropagation();
                                  console.log(`MenuItem ${container.ContainerName} mousedown`);
                                  setIsContainerSelectActive(true);
                              }}
                          >
                              <Box sx={{ display: "flex", flexDirection: "column" }}>
                                  <Typography variant="body2">{container.ContainerName}</Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "11px" }}>
                                      {container.Image.length > 40 ? container.Image.substring(0, 37) + '...' : container.Image}
                                  </Typography>
                              </Box>
                          </MenuItem>
                      ))}
                      {containers.length === 0 && !loadingContainers && (
                          <MenuItem disabled>
                              <Typography variant="body2">No containers found</Typography>
                          </MenuItem>
                      )}
                  </Select>
              </FormControl>

              {/* Existing buttons */}
              <Tooltip title="Clear Terminal">
                  <IconButton
                      size="small"
                      onClick={handleClearTerminal}
                      sx={{
                          color: theme === "dark" ? "#CCC" : "#666",
                          padding: "2px",
                          '&:hover': {
                              backgroundColor: theme === "dark" ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                          }
                      }}
                  >
                      <FiTrash2 size={16} />
                  </IconButton>
              </Tooltip>

              <Tooltip title={isTerminalMaximized ? "Minimize" : "Maximize"}>
                  <IconButton
                      size="small"
                      onClick={() => setIsTerminalMaximized(!isTerminalMaximized)}
                      sx={{
                          color: theme === "dark" ? "#CCC" : "#666",
                          padding: "2px",
                          '&:hover': {
                              backgroundColor: theme === "dark" ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                          }
                      }}
                  >
                      {isTerminalMaximized ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                  </IconButton>
              </Tooltip>
          </Box>
      </Box>
  )
}

export default TerminalHeader