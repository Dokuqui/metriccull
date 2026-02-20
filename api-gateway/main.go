package main

import (
	"bufio"
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
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type ProfilingRun struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	RepoURL      string
	TotalTimeMs  int64
	PeakMemoryKb int64
	Score        string
	Suggestions  []string `gorm:"serializer:json"`
	CreatedAt    time.Time
}

var db *gorm.DB

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

type HistoryItem struct {
	ID           string    `json:"id"`
	RepoURL      string    `json:"repo_url"`
	TotalTimeMs  int64     `json:"total_time_ms"`
	PeakMemoryKb int64     `json:"peak_memory_kb"`
	Score        string    `json:"score"`
	Suggestions  []string  `json:"suggestions"`
	CreatedAt    time.Time `json:"created_at"`
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

	var err error

	err = godotenv.Load("../.env")
	if err != nil {
		log.Println("⚠️  No .env file found, using system env")
	}

	dsn := os.Getenv("DATABASE_URL")
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}

	db.AutoMigrate(&ProfilingRun{})

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

	r.GET("/history", func(c *gin.Context) {
		var history []ProfilingRun
		if err := db.Order("created_at desc").Limit(20).Find(&history).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to fetch history"})
			return
		}
		c.JSON(200, history)
	})

	r.DELETE("/history", func(c *gin.Context) {
		if err := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&ProfilingRun{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear history"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "History cleared successfully"})
	})

	r.GET("/stream-profile", func(c *gin.Context) {
		repoURL := c.Query("repo_url")
		if repoURL == "" {
			c.JSON(400, gin.H{"error": "repo_url is required"})
			return
		}

		c.Writer.Header().Set("Content-Type", "text/event-stream")
		c.Writer.Header().Set("Cache-Control", "no-cache")
		c.Writer.Header().Set("Connection", "keep-alive")
		c.Writer.Header().Set("Transfer-Encoding", "chunked")

		c.SSEvent("log", "Cloning repository...")
		c.Writer.Flush()

		tempDir, err := cloneRepo(repoURL)
		if err != nil {
			c.SSEvent("log", "Clone failed: "+err.Error())
			return
		}
		defer os.RemoveAll(tempDir)

		entryFile := findEntryPoint(tempDir)
		if entryFile == "" {
			c.SSEvent("log", "No Python entry point found.")
			return
		}
		c.SSEvent("log", "Found entry point: "+filepath.Base(entryFile))

		cmd := exec.Command("../cmd-agent/target/debug/cmd-agent", entryFile)
		stdout, _ := cmd.StdoutPipe()
		cmd.Start()

		scanner := bufio.NewScanner(stdout)
		var lastLine string
		for scanner.Scan() {
			lastLine = scanner.Text()
			if lastLine != "" && lastLine[0] != '{' {
				c.SSEvent("log", lastLine)
				c.Writer.Flush()
			}
		}

		cmd.Wait()

		var report RustReport
		json.Unmarshal([]byte(lastLine), &report)
		analysis := getAIAnalysis(report)

		newRun := ProfilingRun{
			RepoURL:      repoURL,
			TotalTimeMs:  report.TotalTimeMs,
			PeakMemoryKb: report.PeakMemoryKb,
			Score:        analysis.Score,
			Suggestions:  analysis.Suggestions,
		}

		if err := db.Create(&newRun).Error; err != nil {
			log.Printf("Failed to save to DB: %v", err)
		}

		finalResult, _ := json.Marshal(FinalResponse{
			Metrics:  report,
			Analysis: analysis,
		})
		c.SSEvent("complete", string(finalResult))
		c.Writer.Flush()
	})

	fmt.Println("🚀 Gateway running on :8080")
	r.Run(":8080")
}

func getAIAnalysis(report RustReport) BrainAnalysis {
	pythonCmd := exec.Command("python3", "../brain/analyser.py")
	stdin, _ := pythonCmd.StdinPipe()
	go func() {
		defer stdin.Close()
		json.NewEncoder(stdin).Encode(report)
	}()
	brainOutput, _ := pythonCmd.Output()
	var analysis BrainAnalysis
	json.Unmarshal(brainOutput, &analysis)
	return analysis
}
