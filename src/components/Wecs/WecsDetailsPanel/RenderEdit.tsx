import { Editor } from '@monaco-editor/react'
import { Box, Stack, Button } from '@mui/material'

interface RenderEditProps {
    editFormat: "yaml" | "json";
    handleFormatChange: (format: "yaml" | "json") => void;
    editedManifest: string;
    handleEditorChange: (value: string | undefined) => void;
    handleUpdate: () => void;
    theme: string;
    jsonToYaml: (json: string) => string;
}

const RenderEdit = ({ editFormat, handleFormatChange, editedManifest, handleEditorChange, handleUpdate, theme, jsonToYaml }:RenderEditProps) => {
  return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Stack direction="row" spacing={4} mb={3} ml={4}>
              <Button
                  variant={editFormat === "yaml" ? "contained" : "outlined"}
                  onClick={() => handleFormatChange("yaml")}
                  sx={{
                      textTransform: "none",
                      backgroundColor: "#2F86FF",
                      borderRadius: "8px",
                      color: "#fff",
                      "&:hover": {
                          backgroundColor: "#1565c0",
                      },
                  }}
              >
                  YAML
              </Button>
              <Button
                  variant={editFormat === "json" ? "contained" : "outlined"}
                  onClick={() => handleFormatChange("json")}
                  sx={{
                      textTransform: "none",
                      backgroundColor: "#2F86FF",
                      borderRadius: "8px",
                      color: "#fff",
                      "&:hover": {
                          backgroundColor: "#1565c0",
                      },
                  }}
              >
                  JSON
              </Button>
          </Stack>
          <Box sx={{ overflow: "auto", maxHeight: "500px" }}>
              <Editor
                  height="500px"
                  language={editFormat}
                  value={
                      editFormat === "yaml"
                          ? jsonToYaml(editedManifest)
                          : editedManifest || "No manifest available"
                  }
                  onChange={handleEditorChange}
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      readOnly: false,
                      automaticLayout: true,
                      wordWrap: "on",
                  }}
              />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                  variant="contained"
                  onClick={handleUpdate}
                  sx={{
                      textTransform: "none",
                      backgroundColor: "#2F86FF",
                      borderRadius: "8px",
                      color: "#fff",
                      "&:hover": {
                          backgroundColor: "#1565c0",
                      },
                  }}
              >
                  Update
              </Button>
          </Box>
      </Box>
  )
}

export default RenderEdit