"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowRight, HelpCircleIcon, LogInIcon, ClipboardCopy, NotebookIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function LandingPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [copiedCommand, setCopiedCommand] = useState("");

    const handleLogin = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        router.push("/farm/");
    };

    const scrollToFeatures = () => {
        const element = document.getElementById("features");
        element?.scrollIntoView({ behavior: "smooth" });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCommand(text);
        setTimeout(() => setCopiedCommand(""), 2000);
    };

    // Command component for consistent styling and copy functionality
    const Command = ({ text }: { text: string }) => (
        <div className="flex items-center bg-gray-100 rounded-md overflow-hidden">
            <code className="p-2 text-primary font-mono">{text}</code>
            <button
                onClick={() => copyToClipboard(text)}
                className="p-2 hover:bg-gray-200"
                title="Copy to clipboard"
            >
                <ClipboardCopy size={16} className={copiedCommand === text ? "text-green-500" : "text-gray-500"} />
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <section className="pt-20 mb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-8"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-8">
                                <img src="/logo.png" alt="EcoHarvest Logo" className="h-10" />
                                <span className="text-xl font-bold text-primary">Diary Dashboard</span>
                            </div>
                        </div>

                        <p className="text-gray-600 text-lg max-w-2xl">
                            The Farm Management System helps farm admins manage users, schedule activities, track performance, and analyze financial data, while staff can log activities, view schedules, and request inventory.
                        </p>

                        <p className="flex space-x-4">
                            <Button onClick={handleLogin} variant={"default"}>
                                Get Started
                                <NotebookIcon size={20} className="ml-2" />
                            </Button>
                            <Button onClick={scrollToFeatures} variant="outline">
                                Help
                                <HelpCircleIcon size={20} className="ml-2" />
                            </Button>
                        </p>
                    </motion.div>
                </div>
            </section>

            <section id="help" className="px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <h2 className="text-3xl font-bold mb-4">User Guide</h2>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            This guide provides an overview of system functionalities, installation steps, and user roles.
                        </p>
                    </motion.div>

                    <div className="space-y-16">
                        {/* Combined Features Section */}
                        <div className="space-y-8">

                            <div className="space-y-16">
                                {/* Admin Features */}
                                <div>
                                    <h4 className="text-xl font-medium mb-6">Admin Features</h4>
                                    <p className="text-gray-600 mb-8">
                                        Farm administrators have full access to manage the entire system, including users, activities, finances, and reporting.
                                    </p>

                                    <div className="space-y-12">
                                        {/* Admin Feature 1: User Management */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">User Management</h5>
                                            <p className="text-gray-600">
                                                Create, edit, and deactivate user accounts. Assign roles and permissions to staff members.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/user-management.jpg"
                                                    alt="User Management"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">User management interface with options to edit roles and permissions</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Feature 2: Financial Tracking */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Financial Analytics</h5>
                                            <p className="text-gray-600">
                                                Record revenue and expenses. Generate profit reports and financial analyses with visual charts.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="home-analytics.jpg"
                                                    alt="Financial Analytics"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Financial dashboard with charts showing farm profit trends and expense breakdowns</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Feature 3: Schedule Creation */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Schedule Management</h5>
                                            <p className="text-gray-600">
                                                Create and assign work schedules to staff members. Set recurring activities and manage calendar events.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/schedule-calendar.jpg"
                                                    alt="Schedule Management"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Schedule creation interface with calendar view and assignment options</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Feature 5: Performance Tracking */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Staff Performance</h5>
                                            <p className="text-gray-600">
                                                Monitor productivity metrics and generate performance reports for individual staff members.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/staff-performance.jpg"
                                                    alt="Performance Dashboard"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Performance analytics showing productivity metrics across different staff members</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Feature 6: Reporting */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Generate Report</h5>
                                            <p className="text-gray-600">
                                                Generate comprehensive reports on farm operations, finances, and staff performance with export options.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/generate-report.jpg"
                                                    alt="Advanced Reporting"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Report generation interface with customizable parameters and export formats</p>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Staff Features */}
                                <div>
                                    <h4 className="text-xl font-medium mb-6">Staff Features</h4>
                                    <p className="text-gray-600 mb-8">
                                        Farm staff members have focused access to tools for daily activities, viewing schedules, and managing basic operational needs.
                                    </p>

                                    <div className="space-y-12">
                                        {/* Staff Feature 1: Activity Logging */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Activity Logging</h5>
                                            <p className="text-gray-600">
                                                Record daily activities with details on time spent, resources used, and outcomes achieved.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/create-activity.jpg"
                                                    alt="Activity Logging"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Activity logging form with fields for recording task details and outcomes</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Staff Feature 3: Inventory Requests */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Resource Requests</h5>
                                            <p className="text-gray-600">
                                                Submit requests for required supplies, tools, and equipment with detailed justifications.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/request-inventory.jpg"
                                                    alt="Resource Requests"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Inventory request form with options to specify quantities and priorities</p>
                                                </div>
                                            </div>
                                        </div>



                                        {/* Staff Feature 5: Notifications */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Notification Center</h5>
                                            <p className="text-gray-600">
                                                Receive updates on schedule changes, request approvals, and system announcements in real-time.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/notification-schedule.jpg"
                                                    alt="Notification Center"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Notification panel showing system alerts and messages for staff</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </section>
        </div>
    );
}