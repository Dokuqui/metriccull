use std::fs;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

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
    println!("🚀 MetricCull Agent Starting...");

    let start_time = Instant::now();
    let mut max_memory: u64 = 0;

    let mut child = Command::new("python3")
        .arg("-c")
        .arg("import time; x = [i for i in range(10_000_000)]; time.sleep(0.5)")
        .stdout(Stdio::null())
        .spawn()
        .expect("Failed to start process");

    let pid = child.id();

    while let Ok(None) = child.try_wait() {
        let current_mem = get_memory_usage(pid);
        if current_mem > max_memory {
            max_memory = current_mem;
        }
        thread::sleep(Duration::from_millis(10));
    }

    let duration = start_time.elapsed();

    println!("--- Performance Report ---");
    println!("Total Time:  {:?}", duration);
    println!(
        "Peak Memory: {} KB ({:.2} MB)",
        max_memory,
        max_memory as f64 / 1024.0
    );
}
