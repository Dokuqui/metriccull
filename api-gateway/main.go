package main

import (
	"fmt"
	"net/http"
	"os/exec"

	"github.com/gin-gonic/gin"
)

type ProfilingJob struct {
	RepoURL string `json:"repo_url" binding:"required"`
}

func main() {
	r := gin.Default()

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

		c.JSON(http.StatusOK, gin.H{
			"message":  "Profiling Complete",
			"raw_data": string(output),
		})
	})

	fmt.Println("🚀 Gateway running on :8080")
	r.Run(":8080")
}
