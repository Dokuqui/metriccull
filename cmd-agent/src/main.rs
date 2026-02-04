use serde::Serialize;
use std::env;
use std::fs;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

#[derive(Serialize)]
struct PerformanceReport {
    total_time_ms: u128,
    peak_memory_kb: u64,
    status: String,
}

fn get_memory_usage(pid: u32) -> u64 {
    let path = format!("/proc/{}/status", pid);
    if let Ok(status) = fs::read_to_string(path) {
        for line in status.lines() {
            if line.starts_with("VmRSS:") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    return parts[1].parse::<u64>().unwrap_or(0);
                }
            }
        }
    }
    0
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Error: No target file path provided.");
        std::process::exit(1);
    }
    let target_file = &args[1];

    let start_time = Instant::now();
    let mut max_memory: u64 = 0;

    let mut child = Command::new("python3")
        .arg(target_file)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .expect("Failed to spawn process");

    let pid = child.id();

    while let Ok(None) = child.try_wait() {
        let current_mem = get_memory_usage(pid);
        if current_mem > max_memory {
            max_memory = current_mem;
        }
        thread::sleep(Duration::from_millis(1));
    }

    let final_mem = get_memory_usage(pid);
    if final_mem > max_memory {
        max_memory = final_mem;
    }

    let report = PerformanceReport {
        total_time_ms: start_time.elapsed().as_millis(),
        peak_memory_kb: max_memory,
        status: "success".to_string(),
    };

    println!("{}", serde_json::to_string(&report).unwrap());
}
