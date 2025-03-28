// SRTN Scheduling Algorithm Visualization
// State
let jobs = [];
const colors = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F67280",
  "#C06C84",
];

function addJob() {
  const newJob = {
    id: jobs.length + 1,
    arrivalTime: 0,
    burstTime: 1,
    remainingTime: 0,
    startTime: -1,
    endTime: 0,
    turnaroundTime: 0,
    lastExecutionTime: -1,
    inQueue: false,
  };
  jobs.push(newJob);
  refreshUI();
}

console.log("Initial jobs:", jobs);

function removeJob(id) {
  jobs = jobs.filter((job) => job.id !== id);
  refreshUI();
}

function refreshUI() {
  const tableBody = document.querySelector("#jobTable tbody");
  tableBody.innerHTML = "";
  jobs.forEach((job, index) => {
    const row = tableBody.insertRow();
    row.innerHTML = `<td>J${job.id}</td>
              <td><input type="number" value="${
                job.arrivalTime
              }" min="0" onchange="updateJobProperty(${index}, 'arrivalTime', this.value)"></td>
              <td><input type="number" value="${
                job.burstTime
              }" min="1" onchange="updateJobProperty(${index}, 'burstTime', this.value)"></td>
              <td>${job.startTime === -1 ? "-" : job.startTime}</td>
              <td>${job.endTime}</td>
              <td>${job.turnaroundTime}</td>
                <td><button class="error" onclick="removeJob(${job.id})">
                <span class="material-icons"
                title="Remove Job J${job.id}">delete_forever</span>
                </button></td>`;
  });
}

function updateJobProperty(index, property, value) {
  jobs[index][property] = parseInt(value);
  jobs[index].remainingTime = jobs[index].burstTime;
}

function calculateSRTN() {
  const cpuCount = parseInt(document.getElementById("cpuCount").value);
  const timeQuantum = parseInt(document.getElementById("timeQuantum").value);

  // Reset job states
  jobs.forEach((job) => {
    job.remainingTime = job.burstTime;
    job.startTime = -1;
    job.endTime = 0;
    job.turnaroundTime = 0;
    job.lastExecutionTime = -1;
    job.inQueue = false;
  });

  let currentTime = 0;
  let completedJobs = 0;
  let runningJobs = new Array(cpuCount).fill(null);
  let jobHistory = [];
  let jobQueueHistory = [];
  let jobQueue = [];

  while (completedJobs < jobs.length) {
    // Check for new arrivals at current time
    jobs.forEach((job) => {
      if (
        job.arrivalTime === currentTime &&
        job.remainingTime > 0 &&
        !job.inQueue
      ) {
        jobQueue.push(job);
        job.inQueue = true;
      }
    });

    // At time quantum intervals or when any job completes
    if (
      currentTime % timeQuantum === 0 ||
      runningJobs.some((job) => job && job.remainingTime === 0)
    ) {
      // Return running jobs to queue if they're not finished
      runningJobs.forEach((runningJob, index) => {
        if (runningJob !== null && runningJob.remainingTime > 0) {
          jobQueue.push(runningJob);
          runningJobs[index] = null;
        }
      });

      // Sort queue by remaining time and arrival time
      jobQueue.sort((a, b) => {
        if (a.remainingTime === b.remainingTime) {
          return a.arrivalTime - b.arrivalTime;
        }
        return a.remainingTime - b.remainingTime;
      });

      // Record queue state for visualization
      jobQueueHistory.push({
        time: currentTime,
        jobs: jobQueue.map((job) => ({
          id: job.id,
          remainingTime: job.remainingTime,
        })),
      });

      // Assign jobs to available CPUs
      for (let i = 0; i < cpuCount && jobQueue.length > 0; i++) {
        if (runningJobs[i] === null) {
          let job = jobQueue.shift();
          if (job.startTime === -1) {
            job.startTime = currentTime;
          }
          runningJobs[i] = job;
        }
      }
    }

    // Process current time unit
    for (let i = 0; i < cpuCount; i++) {
      if (runningJobs[i]) {
        let job = runningJobs[i];
        jobHistory.push({
          jobId: job.id,
          cpuId: i,
          startTime: currentTime,
          endTime: currentTime + 1,
        });

        job.remainingTime--;

        if (job.remainingTime === 0) {
          job.endTime = currentTime + 1;
          job.turnaroundTime = job.endTime - job.arrivalTime;
          completedJobs++;
          runningJobs[i] = null;
        }
      } else {
        jobHistory.push({
          jobId: "idle",
          cpuId: i,
          startTime: currentTime,
          endTime: currentTime + 1,
        });
      }
    }

    currentTime++;
  }

  refreshUI();
  calculateAverageTurnaroundTime();
  drawGanttChart(jobHistory, jobQueueHistory);
}

function calculateAverageTurnaroundTime() {
  const turnaroundTimes = jobs.map((job) => job.turnaroundTime);
  const totalTurnaroundTime = turnaroundTimes.reduce(
    (sum, time) => sum + time,
    0
  );
  const averageTurnaroundTime = totalTurnaroundTime / jobs.length;

  const calculation = turnaroundTimes.join(" + ");
  const result = averageTurnaroundTime.toFixed(2);

  document.getElementById("averageTurnaroundTime").innerHTML = `
          Avg: (${calculation}) / ${jobs.length} = <b>${result}</b>
      `;
}

function drawGanttChart(jobHistory, jobQueueHistory) {
  const ganttChart = document.getElementById("ganttChart");
  ganttChart.innerHTML = "";

  const maxEndTime = Math.max(...jobHistory.map((entry) => entry.endTime));
  const timeQuantum = parseInt(document.getElementById("timeQuantum").value);

  // Draw CPU rows
  for (
    let i = 0;
    i < parseInt(document.getElementById("cpuCount").value);
    i++
  ) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "cpu-row";
    ganttChart.appendChild(rowDiv);

    let currentJobId = null;
    let currentBlock = null;
    let blockStartTime = null;

    jobHistory
      .filter((entry) => entry.cpuId === i)
      .forEach((entry, index) => {
        if (entry.jobId !== currentJobId) {
          if (currentBlock) {
            currentBlock.style.width = `${
              ((entry.startTime - blockStartTime) / maxEndTime) * 100
            }%`;
            rowDiv.appendChild(currentBlock);
          }

          currentJobId = entry.jobId;
          blockStartTime = entry.startTime;

          currentBlock = document.createElement("div");
          currentBlock.className = "job-block";
          if (entry.jobId === "idle") {
            currentBlock.classList.add("idle-block");
          } else {
            currentBlock.style.backgroundColor =
              colors[(entry.jobId - 1) % colors.length];
            currentBlock.textContent = `J${entry.jobId}`;
          }
        }

        if (index === jobHistory.filter((e) => e.cpuId === i).length - 1) {
          currentBlock.style.width = `${
            ((entry.endTime - blockStartTime) / maxEndTime) * 100
          }%`;
          rowDiv.appendChild(currentBlock);
        }
      });
  }

  // Add time axis and other visualizations
  const timeAxisDiv = document.createElement("div");
  timeAxisDiv.className = "time-axis";
  ganttChart.appendChild(timeAxisDiv);

  // Add time markers and job queues
  for (let t = 0; t <= maxEndTime; t += timeQuantum) {
    const markerDiv = document.createElement("div");
    markerDiv.className = "time-marker";
    markerDiv.style.left = `${(t / maxEndTime) * 100}%`;
    markerDiv.textContent = t;
    timeAxisDiv.appendChild(markerDiv);

    const lineDiv = document.createElement("div");
    lineDiv.className = "dashed-line";
    lineDiv.style.left = `${(t / maxEndTime) * 100}%`;
    ganttChart.appendChild(lineDiv);

    const queueEntry = jobQueueHistory.find((entry) => entry.time === t);
    if (queueEntry) {
      const queueDiv = document.createElement("div");
      queueDiv.className = "queue-container";
      queueDiv.style.left = `${(t / maxEndTime) * 100}%`;
      queueDiv.style.top = `${timeAxisDiv.offsetTop + 60}px`;

      const queueJobsDiv = document.createElement("div");
      queueJobsDiv.className = "queue-jobs";
      if (queueEntry.jobs.length > 0) {
        queueJobsDiv.innerHTML = queueEntry.jobs
          .map((job) => `J${job.id} = ${job.remainingTime}`)
          .join("<br>");
      } else {
        queueJobsDiv.innerHTML = "{ }";
      }
      queueDiv.appendChild(queueJobsDiv);
      ganttChart.appendChild(queueDiv);
    }
  }

  // Add job arrival markers
  jobs.forEach((job) => {
    if (job.arrivalTime > 0 && job.arrivalTime <= maxEndTime) {
      // Add job name marker
      const arrivalNameDiv = document.createElement("div");
      arrivalNameDiv.className = "job-arrival-name";
      arrivalNameDiv.style.left = `${(job.arrivalTime / maxEndTime) * 100}%`;
      arrivalNameDiv.textContent = `J${job.id}`;
      timeAxisDiv.appendChild(arrivalNameDiv);

      // Add arrival time marker
      const arrivalTimeDiv = document.createElement("div");
      arrivalTimeDiv.className = "job-arrival";
      arrivalTimeDiv.style.left = `${(job.arrivalTime / maxEndTime) * 100}%`;
      arrivalTimeDiv.textContent = job.arrivalTime;
      timeAxisDiv.appendChild(arrivalTimeDiv);

      // Add arrival vertical line
      const arrivalLineDiv = document.createElement("div");
      arrivalLineDiv.className = "arrival-line";
      arrivalLineDiv.style.left = `${(job.arrivalTime / maxEndTime) * 100}%`;
      ganttChart.appendChild(arrivalLineDiv);
    }
  });

  // Adjust container height
  const containerHeight = ganttChart.offsetHeight + 100;
  document.getElementById(
    "ganttChartContainer"
  ).style.height = `${containerHeight}px`;
}
