/**
 * DOM Utility Functions
 * Reusable helper functions for DOM manipulation
 */
const DOMUtils = {
  /**
   * Create an element with attributes and content
   * @param {string} tag - Element tag name
   * @param {Object} attributes - Element attributes
   * @param {string} content - Element content
   * @returns {HTMLElement} Created element
   */
  createElement(tag, attributes = {}, content = "") {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "className") {
        element.className = value;
      } else if (key === "dataset") {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });

    if (content) {
      element.innerHTML = content;
    }

    return element;
  },

  /**
   * Find element by selector with error handling
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null} Found element or null
   */
  findElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element not found: ${selector}`);
    }
    return element;
  },

  /**
   * Add event listener with error handling
   * @param {HTMLElement} element - Target element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   */
  addEventHandler(element, event, handler) {
    if (element && typeof handler === "function") {
      element.addEventListener(event, handler);
    } else {
      console.warn("Invalid element or handler for event:", event);
    }
  },
};

/**
 * Storage Manager
 * Handles localStorage operations with error handling
 */
const StorageManager = {
  STORAGE_KEY: "kanban-tasks",

  /**
   * Save tasks to localStorage
   * @param {Array} tasks - Array of task objects
   */
  saveTasks(tasks) {
    try {
      const tasksData = JSON.stringify(tasks);
      localStorage.setItem(this.STORAGE_KEY, tasksData);
    } catch (error) {
      console.error("Failed to save tasks:", error);
    }
  },

  /**
   * Load tasks from localStorage
   * @returns {Array} Array of task objects
   */
  loadTasks() {
    try {
      const tasksData = localStorage.getItem(this.STORAGE_KEY);
      return tasksData ? JSON.parse(tasksData) : [];
    } catch (error) {
      console.error("Failed to load tasks:", error);
      return [];
    }
  },

  /**
   * Clear all tasks from localStorage
   */
  clearTasks() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear tasks:", error);
    }
  },
};

/**
 * Task Manager
 * Handles task CRUD operations and state management
 */
const TaskManager = {
  tasks: [],

  /**
   * Initialize task manager
   */
  init() {
    this.tasks = StorageManager.loadTasks();
  },

  /**
   * Generate unique ID for tasks
   * @returns {string} Unique task ID
   */
  generateId() {
    return "task_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Create new task
   * @param {string} title - Task title
   * @param {string} description - Task description
   * @returns {Object} Created task object
   */
  createTask(title, description) {
    const task = {
      id: this.generateId(),
      title: title.trim(),
      description: description.trim(),
      status: "todo",
      createdAt: new Date().toISOString(),
    };

    this.tasks.push(task);
    this.saveTasks();
    return task;
  },

  /**
   * Update task status
   * @param {string} taskId - Task ID
   * @param {string} newStatus - New status
   */
  updateTaskStatus(taskId, newStatus) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = newStatus;
      this.saveTasks();
    }
  },

  /**
   * Delete task
   * @param {string} taskId - Task ID to delete
   */
  deleteTask(taskId) {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    this.saveTasks();
  },

  /**
   * Get tasks by status
   * @param {string} status - Task status
   * @returns {Array} Filtered tasks
   */
  getTasksByStatus(status) {
    return this.tasks.filter((task) => task.status === status);
  },

  /**
   * Save tasks to storage
   */
  saveTasks() {
    StorageManager.saveTasks(this.tasks);
  },
};

/**
 * UI Renderer
 * Handles DOM rendering and updates
 */
const UIRenderer = {
  /**
   * Render a single task card
   * @param {Object} task - Task object
   * @returns {HTMLElement} Task card element
   */
  renderTaskCard(task) {
    const taskCard = DOMUtils.createElement("div", {
      className: "task-card",
      draggable: "true",
      dataset: { taskId: task.id },
    });

    const deleteBtn = DOMUtils.createElement(
      "button",
      {
        className: "delete-btn",
        title: "Delete task",
      },
      "×"
    );

    const taskTitle = DOMUtils.createElement(
      "div",
      {
        className: "task-title",
      },
      task.title
    );

    const taskDescription = DOMUtils.createElement(
      "div",
      {
        className: "task-description",
      },
      task.description || "No description"
    );

    const taskId = DOMUtils.createElement(
      "div",
      {
        className: "task-id",
      },
      `ID: ${task.id.split("_")[2]}`
    );

    // Add delete functionality
    DOMUtils.addEventHandler(deleteBtn, "click", (e) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this task?")) {
        TaskManager.deleteTask(task.id);
        this.renderAllTasks();
      }
    });

    taskCard.appendChild(deleteBtn);
    taskCard.appendChild(taskTitle);
    taskCard.appendChild(taskDescription);
    taskCard.appendChild(taskId);

    return taskCard;
  },

  /**
   * Render tasks in a specific column
   * @param {string} status - Column status
   */
  renderTasksInColumn(status) {
    const columnId =
      status === "inprogress" ? "inprogressList" : status + "List";
    const column = DOMUtils.findElement(`#${columnId}`);

    if (!column) return;

    const tasks = TaskManager.getTasksByStatus(status);
    column.innerHTML = "";

    if (tasks.length === 0) {
      const emptyState = DOMUtils.createElement(
        "div",
        {
          className: "empty-state",
        },
        "No tasks yet. Drag tasks here or add new ones!"
      );
      column.appendChild(emptyState);
    } else {
      tasks.forEach((task) => {
        const taskCard = this.renderTaskCard(task);
        column.appendChild(taskCard);
      });
    }
  },

  /**
   * Render all tasks in all columns
   */
  renderAllTasks() {
    this.renderTasksInColumn("todo");
    this.renderTasksInColumn("inprogress");
    this.renderTasksInColumn("done");
  },
};

/**
 * Drag and Drop Manager
 * Handles drag and drop functionality
 */
const DragDropManager = {
  draggedElement: null,

  /**
   * Initialize drag and drop events
   */
  init() {
    this.setupColumnDropZones();
    this.setupTaskDragHandlers();
  },

  /**
   * Setup drop zones for columns
   */
  setupColumnDropZones() {
    const taskLists = document.querySelectorAll(".task-list");

    taskLists.forEach((list) => {
      DOMUtils.addEventHandler(
        list,
        "dragover",
        this.handleDragOver.bind(this)
      );
      DOMUtils.addEventHandler(list, "drop", this.handleDrop.bind(this));
      DOMUtils.addEventHandler(
        list,
        "dragenter",
        this.handleDragEnter.bind(this)
      );
      DOMUtils.addEventHandler(
        list,
        "dragleave",
        this.handleDragLeave.bind(this)
      );
    });
  },

  /**
   * Setup drag handlers for task cards
   */
  setupTaskDragHandlers() {
    const board = DOMUtils.findElement("#kanbanBoard");

    DOMUtils.addEventHandler(board, "dragstart", (e) => {
      if (e.target.classList.contains("task-card")) {
        this.draggedElement = e.target;
        e.target.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      }
    });

    DOMUtils.addEventHandler(board, "dragend", (e) => {
      if (e.target.classList.contains("task-card")) {
        e.target.classList.remove("dragging");
        this.draggedElement = null;
      }
    });
  },

  /**
   * Handle drag over event
   * @param {Event} e - Drag event
   */
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  },

  /**
   * Handle drag enter event
   * @param {Event} e - Drag event
   */
  handleDragEnter(e) {
    e.preventDefault();
    if (e.currentTarget.classList.contains("task-list")) {
      e.currentTarget.classList.add("drag-over");
    }
  },

  /**
   * Handle drag leave event
   * @param {Event} e - Drag event
   */
  handleDragLeave(e) {
    if (
      e.currentTarget.classList.contains("task-list") &&
      !e.currentTarget.contains(e.relatedTarget)
    ) {
      e.currentTarget.classList.remove("drag-over");
    }
  },

  /**
   * Handle drop event
   * @param {Event} e - Drop event
   */
  handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    if (this.draggedElement) {
      const taskId = this.draggedElement.dataset.taskId;
      const newStatus = this.getStatusFromDropZone(e.currentTarget);

      if (newStatus) {
        TaskManager.updateTaskStatus(taskId, newStatus);
        UIRenderer.renderAllTasks();
        this.init(); // Re-initialize drag handlers for new elements
      }
    }
  },

  /**
   * Get status from drop zone
   * @param {HTMLElement} dropZone - Drop zone element
   * @returns {string} Status string
   */
  getStatusFromDropZone(dropZone) {
    const column = dropZone.closest(".column");
    return column ? column.dataset.status : null;
  },
};

/**
 * Form Handler
 * Handles form submission and validation
 */
const FormHandler = {
  /**
   * Initialize form handlers
   */
  init() {
    const form = DOMUtils.findElement("#taskForm");
    DOMUtils.addEventHandler(form, "submit", this.handleSubmit.bind(this));
  },

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const title = formData.get("title");
    const description = formData.get("description");

    if (this.validateForm(title, description)) {
      TaskManager.createTask(title, description);
      UIRenderer.renderAllTasks();
      DragDropManager.init(); // Re-initialize drag handlers
      this.resetForm(e.target);
    }
  },

  /**
   * Validate form data
   * @param {string} title - Task title
   * @param {string} description - Task description
   * @returns {boolean} Validation result
   */
  validateForm(title, description) {
    if (!title || title.trim().length === 0) {
      alert("Please enter a task title.");
      return false;
    }

    if (title.trim().length > 100) {
      alert("Task title must be less than 100 characters.");
      return false;
    }

    return true;
  },

  /**
   * Reset form fields
   * @param {HTMLFormElement} form - Form element
   */
  resetForm(form) {
    form.reset();
    DOMUtils.findElement("#taskTitle").focus();
  },
};

/**
 * Application Controller
 * Main application initialization and coordination
 */
const KanbanApp = {
  /**
   * Initialize the entire application
   */
  init() {
    console.log("🚀 Initializing Kanban Board...");

    // Initialize all managers in correct order
    TaskManager.init();
    FormHandler.init();
    UIRenderer.renderAllTasks();
    DragDropManager.init();

    // Focus on title input for better UX
    const titleInput = DOMUtils.findElement("#taskTitle");
    if (titleInput) {
      titleInput.focus();
    }

    console.log("✅ Kanban Board initialized successfully!");
    console.log(`📊 Loaded ${TaskManager.tasks.length} tasks from storage`);
  },
};

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  KanbanApp.init();
});

// Handle page unload to ensure data persistence
window.addEventListener("beforeunload", () => {
  TaskManager.saveTasks();
});
