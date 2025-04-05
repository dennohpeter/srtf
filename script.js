// -----------------------------------------------------------------------------------//
//                            // Global Variables //---------------------------------//
// -----------------------------------------------------------------------------------//
const DEFAULT_JOBS = {
  1: [
    {
      id: 1,
      arrivalTime: 0,
      burstTime: 2,
      remainingTime: 0,
      startTime: -1,
      endTime: 0,
      turnaroundTime: 0,
    },

    {
      id: 2,
      arrivalTime: 0,
      burstTime: 1,
      remainingTime: 0,
      startTime: -1,
      endTime: 0,
      turnaroundTime: 0,
    },
    {
      id: 3,
      arrivalTime: 0.5,
      burstTime: 2,
      remainingTime: 0,
      startTime: -1,
      endTime: 0,
      turnaroundTime: 0,
    },
  ],
  2: [
    {
      id: 1,
      arrivalTime: 0,
      burstTime: 3,
      remainingTime: 0,
      startTime: -1,
      endTime: 0,
      turnaroundTime: 0,
    },

    {
      id: 2,
      arrivalTime: 0,
      burstTime: 1,
      remainingTime: 0,
      startTime: -1,
      endTime: 0,
      turnaroundTime: 0,
    },
    {
      id: 3,
      arrivalTime: 0,
      burstTime: 4,
      remainingTime: 0,
      startTime: -1,
      endTime: 0,
      turnaroundTime: 0,
    },

    {
      id: 4,
      arrivalTime: 1,
      burstTime: 1,
      remainingTime: 0,
      startTime: -1,
      endTime: 0,
      turnaroundTime: 0,
    },
  ],

  3: [
    {
      id: 1,
      arrivalTime: 0,
      burstTime: 4,
      remainingTime: 0,
      startTime: -1,
      endTime: 0,
      turnaroundTime: 0,
    },

    {
      id: 2,
      arrivalTime: 0,
      burstTime: 2,
      remainingTime: 0,
      startTime: -1,
      endTime: 0,
      turnaroundTime: 0,
    },
    {
      id: 3,
      arrivalTime: 0,
      burstTime: 6,
      remainingTime: 0,
      startTime: -1,
      endTime: 0,
      turnaroundTime: 0,
    },
    {
      id: 4,
      arrivalTime: 0.5,
      burstTime: 1.5,
      remainingTime: 0,
      startTime: -1,
      endTime: 0,
      turnaroundTime: 0,
    },
  ],
};
const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F67280",
  "#C06C84",
];

let jobs = [];

const addJob = (
  job = {
    id: jobs.length + 1,
    arrivalTime: 0,
    burstTime: 1,
    remainingTime: 0,
    startTime: -1,
    endTime: 0,
    turnaroundTime: 0,
  }
) => {
  jobs.push(job);

  refreshUI();
};

const setJob = ({ value: id }) => {
  jobs =
    DEFAULT_JOBS[id]?.map((job) => ({
      ...job,
      remainingTime: job.burstTime,
    })) || [];

  refreshUI();
};

const deleteJob = (id) => {
  jobs = jobs.filter((job) => job.id !== id);
  refreshUI();
};

function updateJobProperty(id, property, value) {
  jobs[id][property] = parseFloat(value);
  jobs[id].remainingTime = jobs[id].burstTime;
}

const calculateSRTN = () => {
  const timeQuantum = parseInt(document.getElementById("timeQuantum").value);
  const algorithm = document.getElementById("algorithm").value;
  const displayBy = document.getElementById("displayBy").value;

  console.log(
    `Algorithm: ${algorithm}, Time Quantum: ${timeQuantum}, Display By: ${displayBy}`
  );

  algo(algorithm, displayBy === "quantum" ? timeQuantum : undefined);
};

const algo = (algorithm, quantum = undefined) => {
  const cpuCount = parseInt(document.getElementById("cpuCount").value);

  // Reset job states
  jobs.forEach((job) => {
    job.remainingTime = job.burstTime;
    job.startTime = -1;
    job.endTime = 0;
    job.turnaroundTime = 0;
  });

  let currentTime = 0;
  let completed = 0;
  let running = new Array(cpuCount).fill(null);
  let jobHistory = [];
  let jobQueueHistory = [];
  let jobQueue = [];

  // calculate no.of dps based on the burst time or arrival time
  // e.g 1.5 = 0.1, 2.5 = 0.1, 1 = 1, 100 = 1, 1.45 = 0.01
  const STEP = Math.max(
    0,
    ...jobs.map((job) => job.burstTime.toString().split(".")[1]?.length || 0),
    ...jobs.map((job) => job.arrivalTime.toString().split(".")[1]?.length || 0)
  );

  while (completed < jobs.length) {
    // Check for new arrivals from previous time to current time
    jobs.forEach((job) => {
      if (job.arrivalTime == currentTime && job.remainingTime > 0) {
        jobQueue.push(job);
      }
    });

    if (quantum ? currentTime % quantum == 0 : true) {
      //
      running.forEach((runningJob, i) => {
        if (runningJob?.remainingTime > 0) jobQueue.push(runningJob);
        running[i] = null;
      });
      // Sort queue by remaining time and arrival time

      algorithm === "srtf" &&
        jobQueue.sort((a, b) =>
          a.remainingTime === b.remainingTime
            ? a.arrivalTime - b.arrivalTime
            : a.remainingTime - b.remainingTime
        );

      // Record queue state for visualization
      jobQueueHistory.push({
        time: currentTime,
        jobs: jobQueue
          // .toSorted((a, b) => a.id - b.id)
          .map(({ id, remainingTime }) => ({
            id,
            remainingTime,
          })),
      });

      // Assign jobs to available CPUs
      for (let i = 0; i < cpuCount; i++) {
        if (running[i] === null) {
          let job = jobQueue.shift() || null;
          if (job) job.startTime === -1 && (job.startTime = currentTime);

          running[i] = job;
        }
      }
    }
    for (let i = 0; i < cpuCount; i++) {
      const job = running[i];

      if (job) {
        job.remainingTime = toFloat(
          job.remainingTime - Math.pow(10, -STEP),
          STEP
        );

        if (job.remainingTime == 0) {
          job.endTime = toFloat(currentTime + Math.pow(10, -STEP), STEP);
          job.turnaroundTime = job.endTime - job.arrivalTime;
          completed++;

          // Remove job from queue
          running[i] = null;
        }
      }

      jobHistory.push({
        jobId: job?.id || "idle",
        cpuId: i,
        startTime: currentTime,
        endTime: toFloat(currentTime + Math.pow(10, -STEP), STEP),
      });
    }

    currentTime = toFloat(currentTime + Math.pow(10, -STEP), STEP);
  }

  const startTimes = [...new Set(jobs.map((entry) => entry.startTime))];

  jobQueueHistory = jobQueueHistory.filter((job) =>
    startTimes.includes(job.time)
  );

  jobQueueHistory.push({
    time: currentTime,
    jobs: [],
  });

  refreshUI();
  calculateAverageTurnaroundTime();
  drawGanttChart(jobHistory, jobQueueHistory);
};

const calculateAverageTurnaroundTime = () => {
  const turnaroundTimes = jobs.map((job) => job.turnaroundTime);
  const totalTurnaroundTime = turnaroundTimes.reduce(
    (sum, time) => sum + time,
    0
  );
  const averageTurnaroundTime = totalTurnaroundTime / jobs.length;

  const calculation = turnaroundTimes.join(" + ");
  const result = averageTurnaroundTime.toFixed(2);

  const html = `Avg: (${calculation}) / ${jobs.length} = <b>${result}</b>`;

  document.getElementById("averageTurnaroundTime").innerHTML = html;
};

// -----------------------------------------------------------------------------------//
//                            // UI Functions //---------------------------------//
// -----------------------------------------------------------------------------------//
const refreshUI = () => {
  const tableBody = document.querySelector("#jobTable tbody");
  tableBody.innerHTML = "";
  jobs.forEach((job, i) => {
    const row = tableBody.insertRow();
    const html = `<td>J${job.id}</td>
              <td><input type="number" value="${
                job.arrivalTime
              }" min="0" onchange="updateJobProperty(${i}, 'arrivalTime', this.value)"></td>
              <td><input type="number" value="${
                job.burstTime
              }" min="1" onchange="updateJobProperty(${i}, 'burstTime', this.value)"></td>
              <td>${job.startTime === -1 ? "-" : job.startTime}</td>
              <td>${job.endTime}</td>
              <td>${job.turnaroundTime}</td>
                <td><button class="error" onclick="deleteJob(${job.id})">
                <span class="material-icons"
                title="Remove Job J${job.id}">delete_forever</span>
                </button></td>`;
    row.innerHTML = html;
  });
};

// -----------------------------------------------------------------------------------//
//                            // Gantt Chart Functions //---------------------------------//
// -----------------------------------------------------------------------------------//
const drawGanttChart = (jobHistory, jobQueueHistory) => {
  const ganttChart = document.getElementById("ganttChart");
  ganttChart.innerHTML = "";

  const timeQuantum = Math.min(
    1,
    parseInt(document.getElementById("timeQuantum").value)
  );
  const maxEndTime = Math.max(...jobHistory.map((entry) => entry.endTime));
  const cpuCount = parseInt(document.getElementById("cpuCount").value);

  // Draw CPU rows
  for (let i = 0; i < cpuCount; i++) {
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
              COLORS[(entry.jobId - 1) % COLORS.length];
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
  let qt = timeQuantum;
  for ({ time: t, jobs: j } of jobQueueHistory) {
    const markerDiv1 = document.createElement("div");
    markerDiv1.className = "time-marker";
    markerDiv1.style.left = `${(qt / maxEndTime) * 100}%`;
    markerDiv1.textContent = qt;
    timeAxisDiv.appendChild(markerDiv1);

    const markerDiv = document.createElement("div");
    markerDiv.className = "time-marker";
    markerDiv.style.left = `${(t / maxEndTime) * 100}%`;
    markerDiv.textContent = t;
    timeAxisDiv.appendChild(markerDiv);

    const lineDiv1 = document.createElement("div");
    lineDiv1.className = "dashed-line";
    lineDiv1.style.left = `${(qt / maxEndTime) * 100}%`;
    ganttChart.appendChild(lineDiv1);

    const lineDiv = document.createElement("div");
    lineDiv.className = "dashed-line";
    lineDiv.style.left = `${(t / maxEndTime) * 100}%`;
    ganttChart.appendChild(lineDiv);

    if (j) {
      const queueDiv = document.createElement("div");
      queueDiv.className = "queue-container";
      queueDiv.style.left = `${(t / maxEndTime) * 100}%`;
      queueDiv.style.top = `${timeAxisDiv.offsetTop + 60}px`;

      const queueJobsDiv = document.createElement("div");
      queueJobsDiv.className = "queue-jobs";
      if (j.length > 0) {
        queueJobsDiv.innerHTML = j
          .map(({ id, remainingTime }) => `J${id} = ${remainingTime}`)
          .join("<br>");
      } else {
        queueJobsDiv.innerHTML = "𝛳";
      }
      queueDiv.appendChild(queueJobsDiv);
      ganttChart.appendChild(queueDiv);
    }

    qt += timeQuantum;
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
};

// -----------------------------------------------------------------------------------//
//                            // Utility Functions //---------------------------------//
// -----------------------------------------------------------------------------------//

const toFloat = (value, dp) => parseFloat(value.toFixed(dp));
