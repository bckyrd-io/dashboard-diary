"use client";
import { useState, useEffect } from "react";
import { Card } from "../../../../../components/ui/card";
import { Pie, PieChart, Tooltip, Legend, Cell } from "recharts";
import { useParams } from "next/navigation";

interface PerformanceActivity {
    id: number;
    activity: string;
    status: string;
    updatedAt: string;
}

const ChartPage = () => {
    const { userId } = useParams(); // Dynamic route param for user ID
    const [performanceData, setPerformanceData] = useState<PerformanceActivity[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Helper function to group and count occurrences of statuses by activity
    const getStatusCountByActivity = (data: PerformanceActivity[]) => {
        const groupedData: { [key: string]: { [key: string]: number } } = {};

        // Group by activity and count statuses
        data.forEach((item) => {
            if (!groupedData[item.activity]) {
                groupedData[item.activity] = {};
            }

            groupedData[item.activity][item.status] = (groupedData[item.activity][item.status] || 0) + 1;
        });

        // Convert the grouped data to a pie chart friendly format
        const chartData = Object.keys(groupedData).map((activity) => {
            return Object.keys(groupedData[activity]).map((status) => ({
                name: `${activity} - ${status}`,
                status,
                value: groupedData[activity][status],
            }));
        }).flat();

        return chartData;
    };

    const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#d0ed57", "#a4de6c"];

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                // Make the API call using the dynamic userId
                const response = await fetch(`api/performance?userId=${userId}`);
                const data = await response.json();

                if (data.success) {
                    setPerformanceData(data.performance);
                } else {
                    setError("Failed to load performance data");
                }
            } catch (err) {
                setError((err as Error).message || "An error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchPerformance();
    }, [userId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    // Prepare pie chart data
    const pieChartData = getStatusCountByActivity(performanceData);

    return (
        <div className="flex flex-col justify-center items-center min-h-[90vh] p-4">
            <h1 className="text-2xl font-bold mb-6">Staff Performance</h1>

            {/* Pie Chart Section */}
            <Card className="flex flex-col shadow-none pb-10">
                <PieChart width={600} height={400}>
                    <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name" // Use combined name (activity - status) for display
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name }) => `${name}`} // Display activity-status combination in the pie chart
                    >
                        {pieChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    {/* Corrected Tooltip */}
                    <Tooltip />
                    <Legend
                        formatter={(value) => value} // Show the activity-status combo in the legend
                        payload={pieChartData.map((item) => ({
                            value: item.name, // Now legend displays activity-status
                            type: "square",
                            id: item.status,
                            color: COLORS[pieChartData.indexOf(item) % COLORS.length],
                        }))}
                    />
                </PieChart>
            </Card>
        </div>
    );
};

export default ChartPage;
