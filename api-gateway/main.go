package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

type ProfilingJob struct {
	RepoURL string `json:"repo_url" binding:"required"`
}

type RustReport struct {
	TotalTimeMs  int64  `json:"total_time_ms"`
	PeakMemoryKb int64  `json:"peak_memory_kb"`
	Status       string `json:"status"`
}

type BrainAnalysis struct {
	Score       string   `json:"score"`
	Suggestions []string `json:"suggestions"`
}

type FinalResponse struct {
	Metrics  RustReport    `json:"metrics"`
	Analysis BrainAnalysis `json:"analysis"`
}

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

func main() {
	r := gin.Default()

	err := godotenv.Load("../.env")
	if err != nil {
		log.Println("⚠️  No .env file found, using system env")
	}

	r.Use(func(c *gin.Context) {
		origin := os.Getenv("FRONTEND_ORIGIN")
		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.POST("/profile", func(c *gin.Context) {
		var job ProfilingJob
		if err := c.ShouldBindJSON(&job); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		tempDir, err := cloneRepo(job.RepoURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clone repository", "details": err.Error()})
			return
		}
		defer os.RemoveAll(tempDir)

		entryFile := findEntryPoint(tempDir)
		if entryFile == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No Python entry point found (main.py, etc.)"})
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		cmd := exec.CommandContext(ctx, "../cmd-agent/target/debug/cmd-agent", entryFile)

		output, err := cmd.CombinedOutput()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to run profiler",
				"details": err.Error(),
			})
			return
		}

		var report RustReport
		err = json.Unmarshal(output, &report)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to parse agent output", "raw": string(output)})
			return
		}

		pythonCmd := exec.Command("python3", "../brain/analyser.py")
		stdin, _ := pythonCmd.StdinPipe()
		go func() {
			defer stdin.Close()
			json.NewEncoder(stdin).Encode(report)
		}()

		brainOutput, _ := pythonCmd.Output()

		var analysis BrainAnalysis
		json.Unmarshal(brainOutput, &analysis)

		c.JSON(http.StatusOK, FinalResponse{
			Metrics:  report,
			Analysis: analysis,
		})
	})

	fmt.Println("🚀 Gateway running on :8080")
	r.Run(":8080")
}
