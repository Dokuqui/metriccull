use serde::Serialize;
use std::env;
use std::process::{Command, Stdio};
use std::time::Instant;

#[derive(Serialize)]
struct PerformanceReport {
    total_time_ms: u128,
    peak_memory_kb: u64,
    status: String,
}

#[cfg(unix)]
fn get_peak_memory() -> u64 {
    let mut usage = unsafe { std::mem::zeroed::<libc::rusage>() };
    unsafe {
        if libc::getrusage(libc::RUSAGE_CHILDREN, &mut usage) == 0 {
            usage.ru_maxrss as u64
        } else {
            0
        }
    }
}

#[cfg(not(unix))]
fn get_peak_memory() -> u64 {
    0
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        std::process::exit(1);
    }
    let target_file = &args[1];

    let start_time = Instant::now();

    let status = Command::new("python3")
        .arg(target_file)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .expect("Failed to run process");

    let duration = start_time.elapsed().as_millis();
    let peak_mem = get_peak_memory();

    let report = PerformanceReport {
        total_time_ms: duration,
        peak_memory_kb: peak_mem,
        status: if status.success() {
            "success".into()
        } else {
            "failed".into()
        },
    };

    println!("{}", serde_json::to_string(&report).unwrap());
}
