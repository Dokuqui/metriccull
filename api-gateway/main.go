package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"

	"github.com/gin-gonic/gin"
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

		cmd := exec.Command("../cmd-agent/target/debug/cmd-agent")

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
