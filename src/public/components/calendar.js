const notyf = new Notyf();

class Calendar {
    constructor(container, deadlines, projectNames) {
      this.container = container;
      this.deadlines = deadlines;
      this.projectNames = projectNames;
      this.currentDate = new Date();
      this.injectStyles();
      this.init();
    }

    injectStyles() {
      const style = document.createElement("style");
      style.textContent = `
        .calendar-table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;
        }
  
        .calendar-table th,
        .calendar-table td {
          padding: 10px;
          border: 1px solid #ddd;
          width: 14.28%;
          text-align: center;
        }
  
        .calendar-day {
          cursor: pointer;
          transition: all 0.3s ease-in-out;
        }
  
        .calendar-day:hover {
          background-color: lightgray;
          transform: scale(1.1);
        }
  
        .deadline {
          background-color: rgba(255, 0, 0, 0.2);
          color: red;
          font-weight: bold;
        }
  
        .deadline:hover {
          background-color: rgba(255, 0, 0, 0.5);
        }
  
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
  
        .calendar-header button {
          padding: 5px 10px;
          background-color: #182a4e;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.3s;
        }
      `;
      document.head.appendChild(style);
    }
  
    init() {
        this.createCalendarTable();
        this.addEventListeners();
      }
    
      // renderCalendar() {
      //   this.container.innerHTML = '';
    
      //   const calendarHeader = document.createElement('div');
      //   calendarHeader.classList.add('calendar-header');
    
      //   const prevButton = document.createElement('button');
      //   prevButton.textContent = 'Prev';
      //   prevButton.addEventListener('click', () => this.navigateMonth(-1));
    
      //   const monthYearDisplay = document.createElement('div');
      //   monthYearDisplay.textContent = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
      //   const nextButton = document.createElement('button');
      //   nextButton.textContent = 'Next';
      //   nextButton.addEventListener('click', () => this.navigateMonth(1));
    
      //   calendarHeader.appendChild(prevButton);
      //   calendarHeader.appendChild(monthYearDisplay);
      //   calendarHeader.appendChild(nextButton);
    
      //   const calendarBody = document.createElement('div');
      //   calendarBody.classList.add('calendar-body');
    
      //   const daysInMonth = this.getDaysInMonth();
      //   for (let day = 1; day <= daysInMonth; day++) {
      //     const dayElement = document.createElement('div');
      //     dayElement.classList.add('calendar-day');
      //     dayElement.addEventListener("mouseenter", () => {
      //       dayElement.style.backgroundColor = "lightgray";
      //       dayElement.style.transform = "scale(1.1)";
      //       dayElement.style.transition = "all 0.3s ease-in-out";
      //     });
        
      //     dayElement.addEventListener("mouseleave", () => {
      //       dayElement.style.backgroundColor = "";
      //       dayElement.style.transform = "scale(1)";
      //     });
    
      //     if (this.hasDeadline(day)) {
      //       dayElement.classList.add('deadline');
      //       dayElement.title = this.getProjectsForDate(day).join(', ');
      //       dayElement.style = "color: red;";

      //       dayElement.addEventListener("mouseenter", () => {
      //         dayElement.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
      //       });
        
      //       dayElement.addEventListener("mouseleave", () => {
      //         dayElement.style.backgroundColor = "";
      //       });
      //     }
    
      //     dayElement.textContent = day;
      //     calendarBody.appendChild(dayElement);
      //   }
    
      //   this.container.appendChild(calendarHeader);
      //   this.container.appendChild(calendarBody);
      // }

      createCalendarTable() {
        this.container.innerHTML = ""; // Clear existing content
    
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = this.getDaysInMonth();
        const firstDay = new Date(year, month, 1).getDay();
    
        // Create navigation header
        const calendarHeader = document.createElement("div");
        calendarHeader.classList.add("calendar-header");
    
        const prevButton = document.createElement("button");
        prevButton.textContent = "Prev";
        prevButton.addEventListener("click", () => this.navigateMonth(-1));
    
        const monthYearDisplay = document.createElement("div");
        monthYearDisplay.textContent = this.currentDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
    
        const nextButton = document.createElement("button");
        nextButton.textContent = "Next";
        nextButton.addEventListener("click", () => this.navigateMonth(1));
    
        calendarHeader.appendChild(prevButton);
        calendarHeader.appendChild(monthYearDisplay);
        calendarHeader.appendChild(nextButton);
    
        // Create calendar table
        const table = document.createElement("table");
        table.classList.add("calendar-table");
    
        // Create table header
        const headerRow = document.createElement("tr");
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
        daysOfWeek.forEach((day) => {
          const th = document.createElement("th");
          th.textContent = day;
          headerRow.appendChild(th);
        });
    
        table.appendChild(headerRow);
    
        // Fill in the days
        let row = document.createElement("tr");
    
        // Fill empty spaces before the first day
        for (let i = 0; i < firstDay; i++) {
          row.appendChild(document.createElement("td"));
        }
    
        for (let day = 1; day <= daysInMonth; day++) {
          const cell = document.createElement("td");
          cell.textContent = day;
          cell.classList.add("calendar-day");


          // Highlight deadlines
          if (this.hasDeadline(day)) {
            const projectsDue = this.getProjectsForDate(day);
            console.log(projectsDue)
            cell.classList.add("deadline");
            cell.title = this.getProjectsForDate(day).join(", ");
            
            // Click event to show project names
              cell.addEventListener("click", (i) => {

              notyf.success(`Projects Due on ${day}/${month + 1}/${year}:\n${cell.title}`);
              });
            }
    
          row.appendChild(cell);
    
          // Start a new row every Sunday
          if ((firstDay + day) % 7 === 0) {
            table.appendChild(row);
            row = document.createElement("tr");
          }
        }
    
        // Append remaining empty cells for alignment
        while (row.children.length < 7) {
          row.appendChild(document.createElement("td"));
        }
    
        table.appendChild(row);
    
        this.container.appendChild(calendarHeader);
        this.container.appendChild(table);
      }

      formatTime(deadline) {
        const date = new Date(deadline);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
      }     
    
      addEventListeners() {
        // No additional event listeners needed for this vanilla JavaScript implementation
      }
    
      navigateMonth(direction) {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + direction, 1);
        this.createCalendarTable();
      }
    
      getDaysInMonth() {
        return new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
      }
    
      hasDeadline(date) {
        return this.deadlines.some((deadline) => {
          const deadlineDate = new Date(deadline);
          return (
            deadlineDate.getDate() === date &&
            deadlineDate.getMonth() === this.currentDate.getMonth() &&
            deadlineDate.getFullYear() === this.currentDate.getFullYear()
          );
        });
      }
    
      getProjectsForDate(date) {
        return this.deadlines.reduce((projects, deadline, index) => {
          const deadlineDate = new Date(deadline);
          if (
            deadlineDate.getDate() === date &&
            deadlineDate.getMonth() === this.currentDate.getMonth() &&
            deadlineDate.getFullYear() === this.currentDate.getFullYear()
          ) {
            projects.push(`${this.projectNames[index]} due at ${this.formatTime(this.deadlines[index])}`);
          }
          return projects;
        }, []);
      }

      getDeadlinesForProjectOnDate(date) {
        return this.deadlines.reduce((projectsTime, deadline, index) => {
          const deadlineDate = new Date(deadline);
          if (
            deadlineDate.getDate() === date &&
            deadlineDate.getMonth() === this.currentDate.getMonth() &&
            deadlineDate.getFullYear() === this.currentDate.getFullYear()
          ) {
            projectsTime.push(`${deadlineDate.getHours()}:${deadlineDate.getMinutes()}`);
          }
          return projectsTime;
        }, []);
      }
  }

  export default Calendar;