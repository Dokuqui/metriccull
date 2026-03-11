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
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func handleVersions(c *gin.Context) {
	versions := []string{"python3.10", "python3.11", "python3.12", "python3.13"}
	available := []string{}

	for _, v := range versions {
		if _, err := exec.LookPath(v); err == nil {
			available = append(available, v)
		}
	}

	if len(available) == 0 {
		available = append(available, "python3")
	}

	c.JSON(200, available)
}

func handleGetHistory(c *gin.Context) {
	var history []ProfilingRun
	if err := db.Order("created_at desc").Limit(20).Find(&history).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch history"})
		return
	}
	c.JSON(200, history)
}

func handleDeleteHistory(c *gin.Context) {
	if err := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&ProfilingRun{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear history"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "History cleared successfully"})
}

func handleStreamProfile(c *gin.Context) {
	repoURL := c.Query("repo_url")
	version := c.DefaultQuery("version", "python3")
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

	if err := installDependencies(tempDir, version, c); err != nil {
		c.SSEvent("log", "Dependency error: "+err.Error())
	}

	venvPython := filepath.Join(tempDir, "venv", "bin", "python3")

	cmd := exec.Command("../cmd-agent/target/debug/cmd-agent", entryFile)
	cmd.Env = append(os.Environ(), "CUSTOM_PYTHON="+venvPython)
	stdout, _ := cmd.StdoutPipe()
	cmd.Start()

	stopMonitoring := make(chan bool)
	go func() {
		for {
			select {
			case <-stopMonitoring:
				return
			default:
				if cmd.Process != nil {
					cmdStr := fmt.Sprintf("ps -o rss= -p %d,$(pgrep -P %d) 2>/dev/null | awk '{s+=$1} END {print s}'", cmd.Process.Pid, cmd.Process.Pid)
					out, _ := exec.Command("sh", "-c", cmdStr).Output()

					rss := strings.TrimSpace(string(out))
					if rss != "" && rss != "0" {
						c.SSEvent("vitals", rss)
						c.Writer.Flush()
					}
				}
				time.Sleep(50 * time.Millisecond)
			}
		}
	}()

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
	stopMonitoring <- true

	profFile := "profile_data.prof"

	convertCmd := exec.Command("python3", "../brain/profile_converter.py", profFile)
	profileOutput, err := convertCmd.Output()

	var profileData []interface{}
	if err == nil {
		json.Unmarshal(profileOutput, &profileData)
	} else {
		log.Printf("Profile conversion failed: %v", err)
		profileData = []interface{}{}
	}

	var report RustReport
	json.Unmarshal([]byte(lastLine), &report)
	log.Println("Sending data to Gemini AI...")

	analysis := getAIAnalysis(report, profileData)
	log.Println("AI Analysis complete! Saving to DB...")

	newRun := ProfilingRun{
		RepoURL:      repoURL,
		Version:      version,
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
		Profile:  profileData,
	})
	c.SSEvent("complete", string(finalResult))
	c.Writer.Flush()

	os.Remove(profFile)
}

func handleSyncProfile(c *gin.Context) {
	var job ProfilingJob
	if err := c.ShouldBindJSON(&job); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tempDir, err := cloneRepo(job.RepoURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clone", "details": err.Error()})
		return
	}
	defer os.RemoveAll(tempDir)

	entryFile := findEntryPoint(tempDir)
	if entryFile == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No Python entry point found"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "../cmd-agent/target/debug/cmd-agent", entryFile)
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Profiler failed", "details": err.Error()})
		return
	}

	var report RustReport
	if err = json.Unmarshal(output, &report); err != nil {
		c.JSON(500, gin.H{"error": "Parse agent output failed", "raw": string(output)})
		return
	}

	analysis := getAIAnalysis(report, nil)

	c.JSON(http.StatusOK, FinalResponse{
		Metrics:  report,
		Analysis: analysis,
	})
}
