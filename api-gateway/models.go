package main

import (
	"time"

	"github.com/google/uuid"
)

type ProfilingRun struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;default:gen_random_uuid()"`
	RepoURL      string    `json:"repo_url"`
	Version      string    `json:"version"`
	TotalTimeMs  int64     `json:"total_time_ms"`
	PeakMemoryKb int64     `json:"peak_memory_kb"`
	Score        string    `json:"score"`
	Suggestions  []string  `gorm:"serializer:json" json:"suggestions"`
	CreatedAt    time.Time
}

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
	Profile  []interface{} `json:"profile"`
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
