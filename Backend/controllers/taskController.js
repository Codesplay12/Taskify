const Task = require("../models/taskModel");
const User = require("../models/userModel");


const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    }

    let tasks;
    if (req.user.role === "admin") {
      // Admin gets all tasks
      tasks = await Task.find(filter).populate("assignedTo", "name email profileImageUrl");
    } else {
      // Member only sees their own assigned tasks
      filter.assignedTo = req.user._id;
      tasks = await Task.find(filter).populate("assignedTo", "name email profileImageUrl");
    }

    // Add completed checklist count to each task
    tasks = await Promise.all(
      tasks.map(async (task) => {
        const completedCount = task.todoChecklist.filter((item) => item.completed).length;
        return {
          ...task._doc,
          completedTodoCount: completedCount,
        };
      })
    );

    // Summary counts
    const baseFilter = req.user.role === "admin" ? {} : { assignedTo: req.user._id };

    const allTasks = await Task.countDocuments(baseFilter);

    const pendingTasks = await Task.countDocuments({
      ...baseFilter,
      status: "Pending",
    });

    const inProgressTasks = await Task.countDocuments({
      ...baseFilter,
      status: "In Progress",
    });

    const completedTasks = await Task.countDocuments({
      ...baseFilter,
      status: "Completed",
    });

    res.json({
      tasks,
      statusSummary: {
        all: allTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



const getTaskById = async(req,res)=>
{
    try {
        const task = await Task.findById(req.params.id).populate(
          "assignedTo",
          "name email profileImageUrl"
        );

        if(!task) return res.status(404).json({message:"Task not found"});
        res.json(task);
    } catch (error) {
        res.status(500).json({message:"Server error", error:error.message});
    }
}

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist
    } = req.body;

    if (!Array.isArray(assignedTo)) {
      return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      owner: req.user._id, // ✅ REQUIRED FIELD
      createdBy: req.user._id, // optional: for tracking creator separately
      todoChecklist: todoChecklist,
      attachments
    });

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const updateTask = async(req,res)=>
{
    try {
        const task = await Task.findById(req.params.id);

        if(!task) return res.status(404).json({message:"Task not found"});

        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
        task.attachments = req.body.attachments || task.attachments;

        if(req.body.assignedTo)
        {
          if(!Array.isArray(req.body.assignedTo))
          {
            return res.status(400).
            json({message:"assignedTo must be an array of User IDs"});
          }
          task.assignedTo = req.body.assignedTo;
          
        }
        const updatedTask = await task.save();
        res.json({message:"Task updated succesfully", updatedTask});


    } catch (error) {
        res.status(500).json({message:"Server error", error:error.message});
    }
}

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;                // expect "Pending" | "In Progress" | "Completed"

    // ── 1. ensure a valid status was sent ──────────────────────────────
    const allowed = ["Pending", "In Progress", "Completed"];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ message: `status must be one of: ${allowed.join(", ")}` });
    }

    // ── 2. find the task ───────────────────────────────────────────────
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // ── 3. authorisation: admin or task owner / assignee  --------------
    const userIsAssignee = task.assignedTo.some((u) => u.equals(req.user._id));
    const userIsOwner    = task.owner?.equals(req.user._id);
    if (req.user.role !== "admin" && !userIsOwner && !userIsAssignee) {
      return res.status(403).json({ message: "Not allowed to update this task" });
    }

    // ── 4. update & save ───────────────────────────────────────────────
    task.status = status;
    await task.save();

    res.json({ message: "Status updated", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// controllers/taskController.js
const updateTaskChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { todoChecklist } = req.body;   // expect an array of { text, completed? }

    /* ── 1. Validate payload ─────────────────────────────── */
    if (!Array.isArray(todoChecklist)) {
      return res
        .status(400)
        .json({ message: "todoChecklist must be an array of objects" });
    }

    const badItem = todoChecklist.find(
      (i) => typeof i.text !== "string" || i.text.trim() === ""
    );
    if (badItem) {
      return res.status(400).json({ message: "Each checklist item needs a non‑empty text property" });
    }

    /* ── 2. Find task ─────────────────────────────────────── */
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    /* ── 3. Authorisation ─────────────────────────────────── */
    const userIsOwner    = task.owner?.equals(req.user._id);
    const userIsAssignee = task.assignedTo.some((u) => u.equals(req.user._id));

    if (req.user.role !== "admin" && !userIsOwner && !userIsAssignee) {
      return res.status(403).json({ message: "Not allowed to update this task" });
    }

    /* ── 4. Replace checklist & recalc progress ───────────── */
    task.todoChecklist = todoChecklist.map((item) => ({
      text: item.text,
      completed: !!item.completed,
    }));

    const total    = task.todoChecklist.length || 1; // avoid div/0
    const finished = task.todoChecklist.filter((i) => i.completed).length;
    task.progress  = Math.round((finished / total) * 100);

    if (task.progress === 100) {
  task.status = "Completed";
} else if (task.progress > 0) {
  task.status = "In Progress";
} else {
  task.status = "Pending";
}

    await task.save();

    res.json({ message: "Checklist updated", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




// controllers/taskController.js
const getDashboardData = async (req, res) => {
  try {
    /** ------------------------------------------------------------------
     * 1. Build a base filter: admin = {}, member = { assignedTo: me }
     * ------------------------------------------------------------------ */
    const baseFilter =
      req.user.role === "admin" ? {} : { assignedTo: req.user._id };

    /** ------------------------------------------------------------------
     * 2. Status & priority counts in parallel
     * ------------------------------------------------------------------ */
    const [
      totalTasks,
      lowPriority,
      mediumPriority,
      highPriority,
      pendingTasks,
      inProgressTasks,
      completedTasks,
    ] = await Promise.all([
      Task.countDocuments(baseFilter),

      Task.countDocuments({ ...baseFilter, priority: "Low" }),
      Task.countDocuments({ ...baseFilter, priority: "Medium" }),
      Task.countDocuments({ ...baseFilter, priority: "High" }),

      Task.countDocuments({ ...baseFilter, status: "Pending" }),
      Task.countDocuments({ ...baseFilter, status: "In Progress" }),
      Task.countDocuments({ ...baseFilter, status: "Completed" }),
    ]);

    /** ------------------------------------------------------------------
     * 3. Latest tasks (limit 5) – admins see all, members see their own
     * ------------------------------------------------------------------ */
    const latestTasks = await Task.find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assignedTo", "name email");

    /** ------------------------------------------------------------------
     * 4. (Optional) quick member list for admins
     * ------------------------------------------------------------------ */
    let latestMembers = [];
    if (req.user.role === "admin") {
      latestMembers = await User.find({ role: "member" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email profileImageUrl");
    }

    /** ------------------------------------------------------------------
     * 5. Respond
     * ------------------------------------------------------------------ */
    res.json({
      stats: {
        totalTasks,
        priority: { lowPriority, mediumPriority, highPriority },
        status: { pendingTasks, inProgressTasks, completedTasks },
      },
      latestTasks,
      latestMembers, // empty array for non‑admins
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;                    // comes from protect middleware

    /* ---------------------------------------------------------------
       1.  Build filters once so we can reuse them
    -----------------------------------------------------------------*/
    const filter       = { assignedTo: userId };

    /* ---------------------------------------------------------------
       2.  Counts in parallel
    -----------------------------------------------------------------*/
    const [
      totalTasks,
      lowPriority,
      mediumPriority,
      highPriority,
      pendingTasks,
      inProgressTasks,
      completedTasks,
    ] = await Promise.all([
      Task.countDocuments(filter),

      Task.countDocuments({ ...filter, priority: "Low" }),
      Task.countDocuments({ ...filter, priority: "Medium" }),
      Task.countDocuments({ ...filter, priority: "High" }),

      Task.countDocuments({ ...filter, status: "Pending" }),
      Task.countDocuments({ ...filter, status: "In Progress" }),
      Task.countDocuments({ ...filter, status: "Completed" }),
    ]);

    /* ---------------------------------------------------------------
       3.  Latest 5 tasks assigned to the user
    -----------------------------------------------------------------*/
    const latestTasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assignedTo", "name email profileImageUrl");

    /* ---------------------------------------------------------------
       4.  Send response
    -----------------------------------------------------------------*/
    res.json({
      stats: {
        totalTasks,
        priority: { lowPriority, mediumPriority, highPriority },
        status: { pendingTasks, inProgressTasks, completedTasks },
      },
      latestTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData
};
