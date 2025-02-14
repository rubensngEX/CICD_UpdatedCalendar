let currentLineChart = null;
export function showProjectTasksChart(tasksDetails) {
  const lineChartContainer = document.getElementById("myChart");

  if (!lineChartContainer) {
    console.error("Line chart container not found");
    return;
  }

  const { timeline } = tasksDetails;

  // Prepare chart data
  const labels = timeline.map((entry) => entry.date); // Dates as labels
  const completedData = timeline.map((entry) => entry.COMPLETED); // Cumulative completed
  const inProgressData = timeline.map((entry) => entry.IN_PROGRESS); // Cumulative in progress
  const pendingData = timeline.map((entry) => entry.PENDING); // Cumulative pending
  const onHoldData = timeline.map((entry) => entry.ON_HOLD); // Cumulative on hold

  // Destroy the old chart if it exists
  if (currentLineChart) {
    currentLineChart.destroy();
  }

  // Create the new chart
  currentLineChart = new Chart(lineChartContainer, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "COMPLETED",
          data: completedData,
          borderColor: "rgba(54, 199, 89, 0.8)", // Green for line
          backgroundColor: "rgba(54, 199, 89, 0.2)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "IN_PROGRESS",
          data: inProgressData,
          borderColor: "#FFCE56", // Yellow for line
          backgroundColor: "rgba(255, 206, 86, 0.2)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "PENDING",
          data: pendingData,
          borderColor: "#36A2EB", // Blue for line
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "ON_HOLD",
          data: onHoldData,
          borderColor: "#FF6384", // Red for line
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
          labels: {
            boxWidth: 20,
            padding: 15,
            font: { size: 14 },
          },
        },
        tooltip: {
          callbacks: {
            title: (tooltipItems) => `Date: ${tooltipItems[0].label}`,
            label: (tooltipItem) => {
              const status = tooltipItem.dataset.label;
              const count = tooltipItem.raw;
              return `${status}: ${count} task(s)`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Dates",
          },
        },
        y: {
          title: {
            display: true,
            text: "Task Count",
          },
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });
}
