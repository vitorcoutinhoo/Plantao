package worker

import (
	"testing"
	"time"
)

func TestNewPlantaoReminderWorkerUsaIntervaloDiario(t *testing.T) {
	worker := NewPlantaoReminderWorker(nil, nil, nil, workerLoggerFake{})

	if worker.interval != 24*time.Hour {
		t.Fatalf("intervalo = %s, esperado %s", worker.interval, 24*time.Hour)
	}
}
