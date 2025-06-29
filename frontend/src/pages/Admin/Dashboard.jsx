import React, { useContext, useEffect, useState } from "react";
import { useUserAuth } from "../../hooks/useUserAuth";
import { UserContext } from "../../context/userContext";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPath";
import moment from "moment";
import { addThousandsSeparator } from "../../utils/helper";
import InfoCard from "../../components/Cards/InfoCard";
import { LuArrowRight } from "react-icons/lu";
import TaskListTable from "../../components/TaskListTable";
import CustomPieChart from "../../components/Charts/CustomPieChart";
import CustomBarChart from "../../components/Charts/CustomBarChart";

/* ---------- colour palette for the pie ---------- */
const COLORS = ["#8D51FF", "#00B8DB", "#7BCE00"]; // indigo, pink, cyan

const Dashboard = () => {
  useUserAuth();

  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  /* -------- Prepare chart datasets from backend JSON -------- */
  const prepareChartData = (stats) => {
    if (!stats) return;

    /* Pie‑chart: task status distribution */
    const {
      pendingTasks,
      inProgressTasks,
      completedTasks,
    } = stats.status;

    setPieChartData([
      { status: "Pending",     count: pendingTasks },
      { status: "In Progress", count: inProgressTasks },
      { status: "Completed",   count: completedTasks },
    ]);

    /* (Optional) Bar‑chart: priority distribution */
    const { lowPriority, mediumPriority, highPriority } = stats.priority;
    setBarChartData([
      { priority: "Low",    count: lowPriority },
      { priority: "Medium", count: mediumPriority },
      { priority: "High",   count: highPriority },
    ]);
  };

  /* -------- Fetch dashboard data -------- */
  const getDashboardData = async () => {
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.TASKS.GET_DASHBOARD_DATA
      );
      if (data) {
        setDashboardData(data);
        prepareChartData(data.stats); // <- pass stats to chart preparer
      }
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    }
  };

  useEffect(() => {
    getDashboardData();
  }, []);

  const onSeeMore = () => navigate("/admin/tasks");

  return (
    <DashboardLayout activeMenu="Dashboard">
      {/* ---------- Greeting + date ---------- */}
      <div className="card my-5">
        <h2 className="text-xl md:text-2xl">
         Hello! {user?.name}
        </h2>
        <p className="text-xs md:text-[13px] text-gray-400 mt-1.5">
          {moment().format("dddd Do MMM YYYY")}
        </p>

        {/* ---------- Info‑cards ---------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-5">
          <InfoCard
            label="Total Tasks"
            value={addThousandsSeparator(
              dashboardData?.stats?.totalTasks || 0
            )}
            color="bg-primary"
          />
          <InfoCard
            label="Pending"
            value={addThousandsSeparator(
              dashboardData?.stats?.status?.pendingTasks || 0
            )}
            color="bg-violet-500"
          />
          <InfoCard
            label="In Progress"
            value={addThousandsSeparator(
              dashboardData?.stats?.status?.inProgressTasks || 0
            )}
            color="bg-cyan-500"
          />
          <InfoCard
            label="Completed"
            value={addThousandsSeparator(
              dashboardData?.stats?.status?.completedTasks || 0
            )}
            color="bg-lime-500"
          />
        </div>
      </div>

      {/* ---------- Charts + Recent tasks ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
        {/* Task distribution pie */}
        <div>
        <div className="card">
          <div className="flex items-center justify-between">
          <h5 className="font-medium mb-2">Task Distribution</h5>
          </div>
          <CustomPieChart data={pieChartData} colors={COLORS} />
        </div>
        </div>

        <div>
        <div className="card">
          <div className="flex items-center justify-between">
          <h5 className="font-medium mb-2">Task Priority Levels</h5>
          </div>
          <CustomBarChart data={barChartData}  />
        </div>
        </div>

        

        {/* Recent tasks table */}
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between">
              <h5 className="text-lg">Recent Tasks</h5>
              <button className="card-btn" onClick={onSeeMore}>
                See All <LuArrowRight className="text-base" />
              </button>
            </div>
            <TaskListTable tableData={dashboardData?.latestTasks || []} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
