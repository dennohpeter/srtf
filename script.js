// SRTN Scheduling Algorithm Visualization
// State
const step = 0.1; // Time step for the simulation

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

const sampleJobs = {
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
      burstTime: 1.5,
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

function addJob(
  job = {
    id: jobs.length + 1,
    arrivalTime: 0,
    burstTime: 1,
    remainingTime: 0,
    startTime: -1,
    endTime: 0,
    turnaroundTime: 0,
  }
) {
  jobs.push(job);

  refreshUI();
}

function setSampleJob(sample) {
  jobs =
    sampleJobs[sample.value]?.map((job) => ({
      ...job,
      remainingTime: job.burstTime,
    })) || [];

  refreshUI();
}

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

function toFloat(value, decimals = step * 10) {
  return parseFloat(value.toFixed(decimals));
}

function updateJobProperty(index, property, value) {
  jobs[index][property] = parseFloat(value);
  jobs[index].remainingTime = jobs[index].burstTime;
}
function resetJobs() {}

function calculateSRTN() {
  const cpuCount = parseInt(document.getElementById("cpuCount").value);
  const timeQuantum = parseInt(document.getElementById("timeQuantum").value);

  // Reset job states
  jobs.forEach((job) => {
    job.remainingTime = job.burstTime;
    job.startTime = -1;
    job.endTime = 0;
    job.turnaroundTime = 0;
  });

  let currentTime = 0;
  let completedJobs = 0;
  let runningJobs = new Array(cpuCount).fill(null);
  let jobHistory = [];
  let jobQueueHistory = [];
  let jobQueue = [];

  while (completedJobs < jobs.length) {
    // Check for new arrivals from previous time to current time
    jobs.forEach((job) => {
      console.log(
        currentTime,
        runningJobs,
        runningJobs.some((runningJob) =>
          runningJob ? runningJob.remainingTime == 0 : true
        )
      );
      if (
        job.arrivalTime == currentTime &&
        job.remainingTime > 0
        // runningJobs.some((runningJob) =>
        //   runningJob ? runningJob.remainingTime == 0 : true
        // )
      )
        jobQueue.push(job);
    });

    //
    runningJobs.forEach((runningJob, i) => {
      if (runningJob?.remainingTime > 0) jobQueue.push(runningJob);

      runningJobs[i] = null;
    });

    // Sort queue by remaining time and arrival time
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

    console.log(
      JSON.stringify({ currentTime, completedJobs, jobQueue }, null, 2)
    );

    // Assign jobs to available CPUs
    for (let i = 0; i < cpuCount; i++) {
      if (runningJobs[i] === null) {
        let job = jobQueue.shift() || null;

        if (job) {
          job.startTime === -1 && (job.startTime = currentTime);

          console.log({ remainingTime: job.remainingTime, step });
          job.remainingTime = toFloat(job.remainingTime - step);

          if (job.remainingTime == 0.0) {
            job.endTime = toFloat(currentTime + step);
            job.turnaroundTime = job.endTime - job.arrivalTime;
            completedJobs++;
          }
        }

        runningJobs[i] = job;
      }

      jobHistory.push({
        jobId: runningJobs[i]?.id || "idle",
        cpuId: i,
        startTime: currentTime,
        endTime: toFloat(currentTime + step),
      });
    }

    console.log(
      JSON.stringify(
        { jobQueue, runningJobs, currentTime, completedJobs },
        null,
        2
      )
    );

    currentTime = toFloat(currentTime + step);

    // if (currentTime == 1.2) break;
  }

  const startTimes = [...new Set(jobs.map((entry) => entry.startTime))];

  console.log(startTimes);

  jobQueueHistory = jobQueueHistory.filter((job) =>
    startTimes.includes(job.time)
  );

  jobQueueHistory.push({
    time: currentTime,
    jobs: [],
  });

  console.log(JSON.stringify(jobQueueHistory, null, 2));
  console.log(JSON.stringify(jobHistory, null, 2));

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
}
