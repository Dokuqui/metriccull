package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func findEntryPoint(dir string) string {
	priorities := []string{"main.py", "app.py", "run.py", "benchmark.py"}
	for _, name := range priorities {
		path := filepath.Join(dir, name)
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	files, _ := filepath.Glob(filepath.Join(dir, "*.py"))
	if len(files) > 0 {
		return files[0]
	}
	return ""
}

func cloneRepo(repoURL string) (string, error) {
	id := uuid.New().String()
	tempDir := filepath.Join(os.TempDir(), "metriccull-"+id)

	cmd := exec.Command("git", "clone", "--depth", "1", repoURL, tempDir)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git clone failed: %s", string(output))
	}
	return tempDir, nil
}

func installDependencies(dir string, version string, c *gin.Context) error {
	_, err := exec.LookPath(version)
	if err != nil {
		c.SSEvent("log", "Version "+version+" not found. Falling back to python3.")
		c.Writer.Flush()
		version = "python3"
	}

	c.SSEvent("log", "Creating venv with "+version+"...")
	c.Writer.Flush()

	var stderr bytes.Buffer
	venvCmd := exec.Command(version, "-m", "venv", filepath.Join(dir, "venv"))
	venvCmd.Stderr = &stderr

	if err := venvCmd.Run(); err != nil {
		return fmt.Errorf("venv creation failed: %v - %s", err, stderr.String())
	}

	pipPath := filepath.Join(dir, "venv", "bin", "pip")

	files := []struct {
		name string
		args []string
	}{
		{"requirements.txt", []string{"install", "-r", "requirements.txt"}},
		{"pyproject.toml", []string{"install", "."}},
		{"setup.py", []string{"install", "."}},
	}

	found := false
	for _, f := range files {
		if _, err := os.Stat(filepath.Join(dir, f.name)); err == nil {
			c.SSEvent("log", "Installing dependencies from "+f.name+"...")
			c.Writer.Flush()

			cmd := exec.Command(pipPath, f.args...)
			cmd.Dir = dir
			if err := cmd.Run(); err == nil {
				found = true
			}
		}
	}

	if !found {
		c.SSEvent("log", "No manifest found. Pre-loading benchmark suite (numpy, pandas)...")
		c.Writer.Flush()
		exec.Command(pipPath, "install", "numpy", "pandas").Run()
	}

	c.SSEvent("log", "Dependencies ready.")
	return nil
}

func getAIAnalysis(report RustReport, profile []interface{}) BrainAnalysis {
	payload := map[string]interface{}{
		"metrics":         report,
		"top_bottlenecks": profile,
	}

	pythonCmd := exec.Command("python3", "../brain/analyser.py")
	apiKey := os.Getenv("GEMINI_API_KEY")
	pythonCmd.Env = append(os.Environ(), "GEMINI_API_KEY="+apiKey)

	pythonCmd.Stderr = os.Stderr

	stdin, _ := pythonCmd.StdinPipe()
	go func() {
		defer stdin.Close()
		json.NewEncoder(stdin).Encode(payload)
	}()

	brainOutput, err := pythonCmd.Output()
	if err != nil {
		log.Printf("AI Script Failed: %v", err)
	}

	var analysis BrainAnalysis
	if err := json.Unmarshal(brainOutput, &analysis); err != nil {
		log.Printf("Failed to parse AI JSON: %v\nRaw Output: %s", err, string(brainOutput))
	}

	return analysis
}
